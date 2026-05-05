const express = require('express');
const { Op } = require('sequelize');
const { Exam, Candidate, ExamPaper, CandidateProductLine } = require('../models');
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

    // 查询对应的Exam数据
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

    const resultCandidates = rows.map(candidate => {
      const exam = examMap[candidate.id];
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

    res.json({
      exams: resultCandidates,
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