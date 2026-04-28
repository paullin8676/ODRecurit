const express = require('express');
const { Op } = require('sequelize');
const { Exam, Candidate, ExamPaper, CandidateProductLine } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const STAGES = [
  'employee_entry',
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
  'entry',
  'leave'
];

const EXAM_STAGES = ['exam_declare', 'exam_complete'];

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

const EXAM_AND_BEYOND_STAGES = getStagesForModule(EXAM_STAGES);

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, name = '', currentStage = '' } = req.query;

    const pageNum = parseInt(page) || 1;
    const size = parseInt(pageSize) || 20;

    let candidates = [];

    if (currentStage && EXAM_AND_BEYOND_STAGES.includes(currentStage)) {
      candidates = await Candidate.findAll({
        where: { currentStage },
        order: [['createdAt', 'DESC']]
      });
    } else {
      candidates = await Candidate.findAll({
        where: {
          currentStage: {
            [Op.in]: EXAM_AND_BEYOND_STAGES
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

    const exams = await Exam.findAll({
      where: {
        candidateId: {
          [Op.in]: candidateIds.length > 0 ? candidateIds : [0]
        }
      },
      include: [
        { model: ExamPaper, as: 'ExamPaper' }
      ]
    });

    const examMap = {};
    exams.forEach(exam => {
      examMap[exam.candidateId] = exam;
    });

    const resultCandidates = filteredCandidates.map(candidate => {
      const exam = examMap[candidate.id] || new Exam({ candidateId: candidate.id });
      return {
        id: candidate.id,
        name: candidate.name,
        gender: candidate.gender,
        phone: candidate.phone,
        email: candidate.email,
        idCard: candidate.idCard,
        currentStage: candidate.currentStage,
        exam: exam && exam.id ? {
          id: exam.id,
          candidateId: exam.candidateId,
          examPaperId: exam.examPaperId,
          examPaper: exam.ExamPaper,
          isOnlineExam: exam.isOnlineExam,
          examDate: exam.examDate,
          examCompleteDate: exam.examCompleteDate,
          examTotalScore: exam.examTotalScore,
          isCheating: exam.isCheating,
          examScore: exam.examScore,
          examPassed: exam.examPassed
        } : null
      };
    });

    const total = resultCandidates.length;
    const startIndex = (pageNum - 1) * size;
    const endIndex = startIndex + size;
    const paginatedCandidates = resultCandidates.slice(startIndex, endIndex);

    res.json({
      exams: paginatedCandidates,
      total: total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (error) {
    next(error);
  }
});

router.get('/candidate/:id', authenticate, async (req, res, next) => {
  try {
    const exam = await Exam.findOne({
      where: { candidateId: req.params.id },
      include: [
        { model: ExamPaper, as: 'ExamPaper' }
      ]
    });
    res.json({ exam });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { candidateId, ...examData } = req.body;

    let exam = await Exam.findOne({ where: { candidateId } });

    if (exam) {
      exam = await exam.update(examData);
    } else {
      exam = await Exam.create({ candidateId, ...examData });
    }

    exam = await Exam.findByPk(exam.id, {
      include: [
        { model: ExamPaper, as: 'ExamPaper' }
      ]
    });

    res.json({ exam });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const exam = await Exam.findByPk(req.params.id);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    await exam.destroy();
    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;