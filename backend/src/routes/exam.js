const express = require('express');
const { Op } = require('sequelize');
const { Exam, Candidate, ExamPaper, CandidateStage, User } = require('../models');
const { authenticate } = require('../middleware/auth');
const dataPermission = require('../middleware/dataPermission');
const StageService = require('../services/stageService');

const router = express.Router();

router.get('/', authenticate, dataPermission, async (req, res, next) => {
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

    // 添加数据权限过滤
    if (req.consultantIds && req.consultantIds.length > 0) {
      stageWhere.consultantId = { [Op.in]: req.consultantIds };
    }

    // 使用 findAndCountAll 进行数据库分页
    const include = Object.keys(stageWhere).length > 0 ? [
      {
        model: CandidateStage,
        where: stageWhere,
        required: true
      }
    ] : [];

    const { count, rows } = await Candidate.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: size,
      offset: (pageNum - 1) * size,
      include
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

    const resultCandidates = await Promise.all(rows.map(async candidate => {
      const exam = examMap[candidate.id];
      const candidateStage = await StageService.getStage(candidate.id);
      const consultant = candidateStage && candidateStage.consultantId ? await User.findByPk(candidateStage.consultantId) : null;
      return {
        id: candidate.id,
        name: candidate.name,
        gender: candidate.gender,
        phone: candidate.phone,
        email: candidate.email,
        idCard: candidate.idCard,
        currentStage: candidateStage ? candidateStage.currentStage : 'candidate_entry',
        consultantName: consultant ? consultant.realName : '-',
        exam: exam && exam.id ? {
          id: exam.id,
          candidateId: exam.candidateId,
          examPaperId: exam.examPaperId,
          examPaper: exam.ExamPaper,
          isOnlineExam: exam.isOnlineExam,
          examDate: exam.examDate,
          examCompleteDate: exam.examCompleteDate,
          examTotalScore: exam.examTotalScore || (exam.ExamPaper && exam.ExamPaper.totalScore) || 0,
          passLine: exam.passLine || (exam.ExamPaper && exam.ExamPaper.passLine) || 0,
          isCheating: exam.isCheating,
          examScore: exam.examScore,
          currentStatus: exam.currentStatus || 'pending'
        } : null
      };
    }));

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
    
    if (exam) {
      res.json({ 
        exam: {
          ...exam.toJSON(),
          currentStatus: exam.currentStatus || 'pending',
          ExamPaper: exam.ExamPaper
        } 
      });
    } else {
      res.json({ exam: null });
    }
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { candidateId, currentStatus, ...examData } = req.body;

    let exam = await Exam.findOne({ where: { candidateId } });

    if (exam) {
      exam = await exam.update({ currentStatus, ...examData });
    } else {
      exam = await Exam.create({ candidateId, currentStatus, ...examData });
    }

    if (currentStatus === 'passed') {
      await StageService.updateStage(candidateId, 'exam_complete', req.user?.id);
    } else if (currentStatus === 'failed') {
      const stage = await StageService.getStage(candidateId);
      if (stage && stage.currentStage === 'exam_declare') {
        await StageService.updateStage(candidateId, 'exam_complete', req.user?.id);
      }
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