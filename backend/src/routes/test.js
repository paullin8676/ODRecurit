const express = require('express');
const { Op } = require('sequelize');
const { Test, Candidate, CandidateStage } = require('../models');
const { authenticate } = require('../middleware/auth');
const StageService = require('../services/stageService');

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, name = '', currentStage = '', stages = '' } = req.query;

    const pageNum = parseInt(page) || 1;
    const size = parseInt(pageSize) || 20;

    // 构建查询条件
    const where = {};
    
    if (name) {
      where.name = { [Op.like]: `%${name}%` };
    }

    // 构建阶段过滤条件
    const stageWhere = {};
    if (currentStage && currentStage !== '') {
      stageWhere.currentStage = currentStage;
    }
    if (stages && stages !== '') {
      const stageArray = Array.isArray(stages) ? stages : stages.split(',');
      stageWhere.currentStage = { [Op.in]: stageArray };
    }

    // 使用 findAndCountAll 进行数据库分页
    const { count, rows } = await Candidate.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: size,
      offset: (pageNum - 1) * size,
      include: Object.keys(stageWhere).length > 0 ? [
        {
          model: CandidateStage,
          where: stageWhere,
          required: true
        }
      ] : []
    });

    const candidateIds = rows.map(c => c.id);

    // 查询对应的 Test 数据
    const tests = await Test.findAll({
      where: {
        candidateId: {
          [Op.in]: candidateIds.length > 0 ? candidateIds : [0]
        }
      }
    });

    const testMap = {};
    tests.forEach(test => {
      testMap[test.candidateId] = test;
    });

    const resultCandidates = await Promise.all(rows.map(async candidate => {
      const test = testMap[candidate.id];
      const candidateStage = await StageService.getStage(candidate.id);
      return {
        id: candidate.id,
        name: candidate.name,
        gender: candidate.gender,
        phone: candidate.phone,
        email: candidate.email,
        idCard: candidate.idCard,
        currentStage: candidateStage ? candidateStage.currentStage : 'candidate_entry',
        test: test && test.id ? {
          id: test.id,
          candidateId: test.candidateId,
          issueDate: test.issueDate,
          worryValue: test.worryValue,
          optimismValue: test.optimismValue,
          consistency: test.consistency,
          emotionScore: test.emotionScore,
          currentStatus: test.currentStatus
        } : null
      };
    }));

    res.json({
      tests: resultCandidates,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: count
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/candidate/:candidateId', authenticate, async (req, res, next) => {
  try {
    const test = await Test.findOne({
      where: { candidateId: req.params.candidateId }
    });
    res.json({ test });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { candidateId, issueDate, worryValue, optimismValue, consistency, emotionScore, currentStatus } = req.body;

    const candidate = await Candidate.findByPk(candidateId);
    if (!candidate) {
      return res.status(400).json({ error: 'Candidate not found' });
    }

    const [test, created] = await Test.findOrCreate({
      where: { candidateId },
      defaults: {
        issueDate,
        worryValue,
        optimismValue,
        consistency,
        emotionScore,
        currentStatus: currentStatus || 'pending'
      }
    });

    if (!created) {
      await test.update({
        issueDate,
        worryValue,
        optimismValue,
        consistency,
        emotionScore,
        currentStatus: currentStatus || 'pending'
      });
    }

    if (currentStatus === 'passed' || currentStatus === 'failed' || currentStatus === 'abandoned') {
      await StageService.updateStage(candidateId, 'test_complete', req.user?.id);
    }

    const updatedTest = await Test.findByPk(test.id);

    res.json(updatedTest);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const test = await Test.findByPk(req.params.id);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const { issueDate, worryValue, optimismValue, consistency, emotionScore, currentStatus } = req.body;

    await test.update({
        issueDate,
        worryValue,
        optimismValue,
        consistency,
        emotionScore,
        currentStatus: currentStatus || 'pending'
    });

    if (currentStatus === 'passed' || currentStatus === 'failed' || currentStatus === 'abandoned') {
      await StageService.updateStage(test.candidateId, 'test_complete', req.user?.id);
    }

    const updatedTest = await Test.findByPk(test.id);

    res.json(updatedTest);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const test = await Test.findByPk(req.params.id);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    await test.destroy();
    res.json({ message: 'Test deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;