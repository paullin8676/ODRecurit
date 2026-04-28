const express = require('express');
const { Op, fn, col, literal } = require('sequelize');
const { Candidate, User, ProductLine, CandidateProductLine } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/by-consultant', authenticate, async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    const where = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    if (req.user.role === 'consultant') {
      where.consultantId = req.user.id;
    }

    let dateFormat;
    switch (groupBy) {
      case 'week':
        dateFormat = '%Y-%u';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      case 'quarter':
        dateFormat = '%Y-Q';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const results = await CandidateProductLine.findAll({
      where,
      attributes: [
        'consultantId',
        [fn('strftime', dateFormat, col('createdAt')), 'period'],
        [fn('COUNT', '*'), 'total']
      ],
      include: [
        { model: User, as: 'consultant', attributes: ['id', 'username', 'realName'] }
      ],
      group: ['consultantId', 'period'],
      order: [[literal('period'), 'DESC']]
    });

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

    if (req.user.role === 'consultant') {
      where.consultantId = req.user.id;
    }

    const results = await CandidateProductLine.findAll({
      where,
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

    if (req.user.role === 'consultant') {
      where.consultantId = req.user.id;
    }

    const candidates = await CandidateProductLine.findAll({
      where,
      attributes: ['currentStage', 'createdAt', 'examDate', 'examCompleteDate', 'recommendDate', 'qualificationInterviewDate', 'entryDate', 'testCompleteDate']
    });

    const stats = {
      employeeToExam: [],
      examDeclareToComplete: [],
      recommendToQualification: [],
      preStageTotal: [],
      interviewStageTotal: []
    };

    for (const c of candidates) {
      if (c.examDate && c.createdAt) {
        stats.employeeToExam.push((new Date(c.examDate) - new Date(c.createdAt)) / (1000 * 60 * 60 * 24));
      }
      if (c.examCompleteDate && c.examDate) {
        stats.examDeclareToComplete.push((new Date(c.examCompleteDate) - new Date(c.examDate)) / (1000 * 60 * 60 * 24));
      }
      if (c.qualificationInterviewDate && c.recommendDate) {
        stats.recommendToQualification.push((new Date(c.qualificationInterviewDate) - new Date(c.recommendDate)) / (1000 * 60 * 60 * 24));
      }
      if (c.testCompleteDate && c.createdAt) {
        stats.preStageTotal.push((new Date(c.testCompleteDate) - new Date(c.createdAt)) / (1000 * 60 * 60 * 24));
      }
      if (c.entryDate && c.recommendDate) {
        stats.interviewStageTotal.push((new Date(c.entryDate) - new Date(c.recommendDate)) / (1000 * 60 * 60 * 24));
      }
    }

    const calculateAvg = (arr) => {
      if (arr.length === 0) return 0;
      return (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);
    };

    const result = {
      employeeToExam: { avgDays: calculateAvg(stats.employeeToExam), count: stats.employeeToExam.length },
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
    const where = {};

    if (req.user.role === 'consultant') {
      where.consultantId = req.user.id;
    }

    const total = await CandidateProductLine.count({ where });

    const byStage = await CandidateProductLine.findAll({
      where,
      attributes: ['currentStage', [fn('COUNT', '*'), 'count']],
      group: ['currentStage']
    });

    const byProductLine = await CandidateProductLine.findAll({
      where,
      attributes: ['productLineId', [fn('COUNT', '*'), 'count']],
      include: [{ model: ProductLine, attributes: ['id', 'name'] }],
      group: ['productLineId']
    });

    const passedExam = await CandidateProductLine.count({ where: { ...where, examPassed: true } });
    const passedTest = await CandidateProductLine.count({ where: { ...where, testPassed: true } });
    const inOffer = await CandidateProductLine.count({ where: { ...where, currentStage: 'offer' } });
    const entered = await CandidateProductLine.count({ where: { ...where, currentStage: 'entry' } });

    res.json({
      summary: {
        total,
        byStage,
        byProductLine,
        passedExam,
        passedTest,
        inOffer,
        entered
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
