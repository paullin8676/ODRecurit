const express = require('express');
const { Op } = require('sequelize');
const { Test, Candidate, TestType, CandidateProductLine, ProductLine, Interview } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const STAGES = [
  'candidate_entry',
  'exam_declare',
  'exam_complete',
  'test_declare',
  'test_complete',
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
];

const TEST_STAGES = ['test_declare', 'test_complete'];

const getStagesFrom = (startStage) => {
  const startIndex = STAGES.indexOf(startStage);
  if (startIndex === -1) return [];
  return STAGES.slice(startIndex);
};

const getStagesForModule = (moduleStages) => {
  const allStages = new Set();
  moduleStages.forEach(stage => {
    getStagesFrom(stage).forEach(s => allStages.add(s));
  });
  return Array.from(allStages);
};

const TEST_AND_BEYOND_STAGES = getStagesForModule(TEST_STAGES);

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, name = '', currentStage = '' } = req.query;

    const pageNum = parseInt(page) || 1;
    const size = parseInt(pageSize) || 20;

    let candidates = [];

    if (currentStage && TEST_AND_BEYOND_STAGES.includes(currentStage)) {
      candidates = await Candidate.findAll({
        where: { currentStage },
        order: [['createdAt', 'DESC']]
      });
    } else {
      candidates = await Candidate.findAll({
        where: {
          currentStage: {
            [Op.in]: TEST_AND_BEYOND_STAGES
          }
        },
        order: [['createdAt', 'DESC']]
      });
    }

    let filteredCandidates = candidates;

    if (name) {
      const nameLower = name.toLowerCase();
      filteredCandidates = filteredCandidates.filter(c =>
        c.name && c.name.toLowerCase().includes(nameLower)
      );
    }

    const candidateIds = filteredCandidates.map(c => c.id);

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

    const resultCandidates = filteredCandidates.map(candidate => {
      const test = testMap[candidate.id] || new Test({ candidateId: candidate.id });
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

    const total = resultCandidates.length;
    const startIndex = (pageNum - 1) * size;
    const endIndex = startIndex + size;
    const paginatedCandidates = resultCandidates.slice(startIndex, endIndex);

    res.json({
      tests: paginatedCandidates,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total
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