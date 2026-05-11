const express = require('express');
const { Op, fn, col, literal } = require('sequelize');
const { Candidate, User, BusinessLine, Exam, Test, Employee, Interview, InterviewRound, CandidateStage } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/by-consultant', authenticate, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const users = await User.findAll({
      where: {
        role: { [Op.in]: ['consultant', 'manager'] },
        isActive: true,
        username: { [Op.ne]: 'admin' }
      },
      attributes: ['id', 'username', 'realName', 'role']
    });

    const results = [];
    for (const user of users) {
      const where = { consultantId: user.id };
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt[Op.gte] = new Date(startDate);
        if (endDate) where.createdAt[Op.lte] = new Date(endDate);
      }
      
      const count = await CandidateStage.count({ where });

      results.push({
        consultantId: user.id,
        consultant: user,
        total: count
      });
    }

    res.json({ statistics: results });
  } catch (error) {
    next(error);
  }
});

router.get('/by-stage', authenticate, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const { CandidateStage } = require('../models');
    const results = await CandidateStage.findAll({
      attributes: [
        'currentStage',
        [fn('COUNT', '*'), 'count']
      ],
      group: ['currentStage'],
      order: [[literal('count'), 'DESC']]
    });

    res.json({ statistics: results });
  } catch (error) {
    next(error);
  }
});

router.get('/process-efficiency', authenticate, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const candidates = await Candidate.findAll({
      where,
      attributes: ['id', 'createdAt']
    });

    const stats = {
      candidateToExam: [],
      examDeclareToComplete: [],
      recommendToQualification: [],
      preStageTotal: [],
      interviewStageTotal: []
    };

    for (const candidate of candidates) {
      const candidateId = candidate.id;

      const exam = await Exam.findOne({ where: { candidateId } });
      const test = await Test.findOne({ where: { candidateId } });
      const interview = await Interview.findOne({ where: { candidateId } });
      const interviewRounds = interview ? await InterviewRound.findAll({ where: { interviewId: interview.id }, order: [['stageIndex', 'ASC']] }) : [];

      if (exam?.examDate && candidate.createdAt) {
        stats.candidateToExam.push((new Date(exam.examDate) - new Date(candidate.createdAt)) / (1000 * 60 * 60 * 24));
      }

      if (exam?.examCompleteDate && exam?.examDate) {
        stats.examDeclareToComplete.push((new Date(exam.examCompleteDate) - new Date(exam.examDate)) / (1000 * 60 * 60 * 24));
      }

      const recommendInterviewRound = interviewRounds.find(r => r.stageCode === 'recommend_interview');
      const qualificationInterviewRound = interviewRounds.find(r => r.stageCode === 'qualification_interview');

      if (qualificationInterviewRound?.scheduledDate && recommendInterviewRound?.scheduledDate) {
        stats.recommendToQualification.push((new Date(qualificationInterviewRound.scheduledDate) - new Date(recommendInterviewRound.scheduledDate)) / (1000 * 60 * 60 * 24));
      }

      const employee = await Employee.findOne({ where: { candidateId } });
      if (employee?.entryDate && recommendInterviewRound?.scheduledDate) {
        stats.interviewStageTotal.push((new Date(employee.entryDate) - new Date(recommendInterviewRound.scheduledDate)) / (1000 * 60 * 60 * 24));
      }
    }

    const calculateAvg = (arr) => {
      if (arr.length === 0) return 0;
      return (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);
    };

    const result = {
      candidateToExam: { avgDays: calculateAvg(stats.candidateToExam), count: stats.candidateToExam.length },
      examDeclareToComplete: { avgDays: calculateAvg(stats.examDeclareToComplete), count: stats.examDeclareToComplete.length },
      recommendToQualification: { avgDays: calculateAvg(stats.recommendToQualification), count: stats.recommendToQualification.length },
      preStageTotal: { avgDays: calculateAvg(stats.preStageTotal), count: stats.preStageTotal.length },
      interviewStageTotal: { avgDays: calculateAvg(stats.interviewStageTotal), count: stats.interviewStageTotal.length }
    };

    res.json({ statistics: result });
  } catch (error) {
    next(error);
  }
});

router.get('/summary', authenticate, async (req, res, next) => {
  try {
    let total = await Candidate.count();

    if (req.user.role === 'consultant') {
      total = await CandidateStage.count({ where: { consultantId: req.user.id } });
    }

    const byStage = await CandidateStage.findAll({
      attributes: ['currentStage', [fn('COUNT', '*'), 'count']],
      group: ['currentStage']
    });

    const byBusinessLine = await Interview.findAll({
      attributes: ['businessLineId', [fn('COUNT', '*'), 'count']],
      include: [{ model: BusinessLine, attributes: ['id', 'name'], as: 'BusinessLine' }],
      where: { businessLineId: { [Op.not]: null } },
      group: ['businessLineId']
    });

    const passedExam = await Exam.count({ where: { currentStatus: 'passed' } });
    const passedTest = await Test.count({ where: { currentStatus: 'passed' } });
    const testComplete = await CandidateStage.count({ where: { currentStage: 'test_complete' } });
    const pendingOnboarding = await CandidateStage.count({ where: { currentStage: 'pending_onboarding' } });
    const inOffer = await CandidateStage.count({ where: { currentStage: 'offer' } });
    const entered = await CandidateStage.count({ where: { currentStage: 'entry' } });

    res.json({
      summary: {
        total,
        byStage,
        byBusinessLine,
        passedExam,
        passedTest,
        testComplete,
        pendingOnboarding,
        inOffer,
        entered
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
