const express = require('express');
const { Op } = require('sequelize');
const { Test, Candidate, TestType, CandidateProductLine, ProductLine, Interview } = require('../models');
const { authenticate } = require('../middleware/auth');

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
    
    if (currentStage) {
      where.currentStage = currentStage;
    } else if (stages) {
      const stagesArray = Array.isArray(stages) ? stages : stages.split(',');
      where.currentStage = { [Op.in]: stagesArray };
    }

    // 使用 findAndCountAll 进行数据库分页
    const { count, rows } = await Candidate.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: size,
      offset: (pageNum - 1) * size,
      include: []
    });

    const candidateIds = rows.map(c => c.id);

    // 查询对应的 Test 数据
    const tests = await Test.findAll({
      where: {
        candidateId: {
          [Op.in]: candidateIds.length > 0 ? candidateIds : [0]
        }
      },
      include: [
        { model: TestType, as: 'TestType' }
      ]
    });

    const testMap = {};
    tests.forEach(test => {
      testMap[test.candidateId] = test;
    });

    const resultCandidates = rows.map(candidate => {
      const test = testMap[candidate.id];
      return {
        id: candidate.id,
        name: candidate.name,
        gender: candidate.gender,
        phone: candidate.phone,
        email: candidate.email,
        idCard: candidate.idCard,
        currentStage: candidate.currentStage,
        test: test && test.id ? {
          id: test.id,
          candidateId: test.candidateId,
          testTypeId: test.testTypeId,
          testType: test.TestType,
          testDate: test.testDate,
          testCompleteDate: test.testCompleteDate,
          worryValue: test.worryValue,
          optimismValue: test.optimismValue,
          consistency: test.consistency,
          testPassed: test.testPassed
        } : null
      };
    });

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
      where: { candidateId: req.params.candidateId },
      include: [
        {
          model: TestType,
          attributes: ['id', 'name']
        }
      ]
    });
    res.json({ test });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { candidateId, testTypeId, testDate, testCompleteDate, worryValue, optimismValue, consistency, testPassed } = req.body;

    const candidate = await Candidate.findByPk(candidateId);
    if (!candidate) {
      return res.status(400).json({ error: 'Candidate not found' });
    }

    if (testTypeId) {
      const testType = await TestType.findByPk(testTypeId);
      if (!testType) {
        return res.status(400).json({ error: 'Test type not found' });
      }
    }

    const [test, created] = await Test.findOrCreate({
      where: { candidateId },
      defaults: {
        testTypeId,
        testDate,
        testCompleteDate,
        worryValue,
        optimismValue,
        consistency,
        testPassed
      }
    });

    if (!created) {
      await test.update({
        testTypeId,
        testDate,
        testCompleteDate,
        worryValue,
        optimismValue,
        consistency,
        testPassed
      });
    }

    const updatedTest = await Test.findByPk(test.id, {
      include: [
        {
          model: TestType,
          attributes: ['id', 'name']
        }
      ]
    });

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

    const { testTypeId, testDate, testCompleteDate, worryValue, optimismValue, consistency, testPassed } = req.body;

    if (testTypeId) {
      const testType = await TestType.findByPk(testTypeId);
      if (!testType) {
        return res.status(400).json({ error: 'Test type not found' });
      }
    }

    await test.update({
      testTypeId,
      testDate,
      testCompleteDate,
      worryValue,
      optimismValue,
      consistency,
      testPassed
    });

    const updatedTest = await Test.findByPk(test.id, {
      include: [
        {
          model: TestType,
          attributes: ['id', 'name']
        }
      ]
    });

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