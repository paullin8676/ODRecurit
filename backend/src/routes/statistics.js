const express = require('express');
const { Op, fn, col, literal } = require('sequelize');
const sequelize = require('../config/database');
const { Candidate, User, BusinessLine, Exam, ExamPaper, Test, Employee, Interview, InterviewRound, CandidateStage } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/by-consultant', authenticate, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const { Role, UserRole } = require('../models');
    
    const users = await User.findAll({
      where: {
        isActive: true,
        username: { [Op.ne]: 'admin' }
      },
      attributes: ['id', 'username', 'realName'],
      include: [{
        model: Role,
        through: UserRole,
        as: 'Roles'
      }]
    });
    
    const filteredUsers = users.filter(user => 
      user.Roles.some(r => ['consultant', 'manager', 'supervisor', 'director'].includes(r.code))
    );

    const results = [];
    for (const user of filteredUsers) {
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

    const hasConsultantRoleOnly = req.user.roles.length === 1 && req.user.roles[0].code === 'consultant';
    if (hasConsultantRoleOnly) {
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

const CandidateStageTimelineService = require('../services/CandidateStageTimelineService');

router.get('/stage-duration-records', authenticate, async (req, res, next) => {
  try {
    const { startDate, endDate, leaveStartDate, leaveEndDate, stage, stages, name, page = 1, pageSize = 20, sortField, sortOrder } = req.query;
    const result = await CandidateStageTimelineService.getDurationRecords({
      startDate, endDate, leaveStartDate, leaveEndDate, stage, stages, name, page: parseInt(page), pageSize: parseInt(pageSize), sortField, sortOrder
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/stage-duration-agg', authenticate, async (req, res, next) => {
  try {
    const { startDate, endDate, stage } = req.query;
    const result = await CandidateStageTimelineService.getDurationAggregations({
      startDate, endDate, stage
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/candidate-total-durations', authenticate, async (req, res, next) => {
  try {
    const result = await CandidateStageTimelineService.getCandidateTotalDurations();
    res.json({ records: result });
  } catch (error) {
    next(error);
  }
});

router.get('/stage-trend', authenticate, async (req, res, next) => {
  try {
    const { periodDays = 7, startDate, endDate } = req.query;
    const result = await CandidateStageTimelineService.getStageTrend({ periodDays, startDate, endDate });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/total-flow-trend', authenticate, async (req, res, next) => {
  try {
    const { periodDays = 7, startDate, endDate } = req.query;
    const result = await CandidateStageTimelineService.getTotalFlowTrend({ periodDays, startDate, endDate });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/by-business-line-late-stage', authenticate, async (req, res, next) => {
  try {
    const [results] = await sequelize.query(`
      SELECT 
        bl.id AS businessLineId,
        bl.name AS businessLineName,
        COUNT(*) AS count
      FROM candidate_stage cs
      LEFT JOIN interview i ON cs.candidate_id = i.candidate_id
      LEFT JOIN business_line bl ON i.business_line_id = bl.id
      WHERE cs.current_stage IN (
        'recommend_interview',
        'qualification_interview',
        'tech_interview_1',
        'tech_interview_2',
        'manager_interview',
        'approval',
        'offer',
        'pending_onboarding',
        'entry',
        'leave'
      )
      GROUP BY bl.id, bl.name
    `);

    res.json({ 
      statistics: results.map(r => ({
        businessLineId: r.businessLineId,
        businessLineName: r.businessLineName || '未分配业务线',
        count: parseInt(r.count)
      }))
    });
  } catch (error) {
    next(error);
  }
});

router.get('/exam-by-paper-status', authenticate, async (req, res, next) => {
  try {
    const [results] = await sequelize.query(`
      SELECT 
        ep.name AS paperName,
        cs.current_stage AS currentStage,
        e.current_status AS examStatus,
        COUNT(*) AS count
      FROM candidate_stage cs
      JOIN exam e ON cs.candidate_id = e.candidate_id
      LEFT JOIN exam_paper ep ON e.exam_paper_id = ep.id
      WHERE cs.current_stage IN ('exam_declare', 'exam_complete')
      GROUP BY ep.name, cs.current_stage, e.current_status
    `);

    res.json({ 
      statistics: results.map(r => ({
        paperName: r.paperName || '未关联试卷',
        currentStage: r.currentStage,
        examStatus: r.examStatus,
        count: parseInt(r.count)
      }))
    });
  } catch (error) {
    next(error);
  }
});

router.get('/test-by-status', authenticate, async (req, res, next) => {
  try {
    const [results] = await sequelize.query(`
      SELECT 
        cs.current_stage AS currentStage,
        t.current_status AS testStatus,
        COUNT(*) AS count
      FROM candidate_stage cs
      JOIN test t ON cs.candidate_id = t.candidate_id
      WHERE cs.current_stage IN ('test_declare', 'test_complete')
      GROUP BY cs.current_stage, t.current_status
    `);

    res.json({ 
      statistics: results.map(r => ({
        currentStage: r.currentStage,
        testStatus: r.testStatus,
        count: parseInt(r.count)
      }))
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
