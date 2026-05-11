
const express = require('express');
const { Candidate, User, BusinessLine, ExamPaper, Interview, InterviewRound, Employee, Test, CandidateStage } = require('../models');
const { authenticate } = require('../middleware/auth');
const StageService = require('../services/stageService');

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

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { name, currentStage, stages, page = 1, pageSize = 20 } = req.query;
    const { Op } = require('sequelize');
    
    const where = {};
    const include = [
      {
        model: User,
        as: 'lastOperator',
        attributes: ['id', 'username', 'realName']
      },
      {
        model: CandidateStage,
        attributes: ['currentStage', 'consultantId'],
        include: [
          {
            model: User,
            as: 'consultant',
            attributes: ['id', 'username', 'realName']
          }
        ]
      }
    ];
    const stageWhere = {};
    
    if (name) {
      where.name = { [Op.like]: `%${name}%` };
    }

    if (currentStage && currentStage !== '') {
      stageWhere.currentStage = currentStage;
    }

    if (stages && stages !== '') {
      const stageArray = stages.split(',');
      stageWhere.currentStage = { [Op.in]: stageArray };
    }

    if (Object.keys(stageWhere).length > 0) {
      include[1].where = stageWhere;
    }

    const { count, rows } = await Candidate.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize),
      include
    });

    const candidatesWithStage = rows.map(candidate => {
      const candidateObj = candidate.toJSON();
      if (candidateObj.CandidateStage) {
        candidateObj.currentStage = candidateObj.CandidateStage.currentStage;
        if (candidateObj.CandidateStage.consultant) {
          candidateObj.consultant = candidateObj.CandidateStage.consultant;
        }
      }
      return candidateObj;
    });

    res.json({
      candidates: candidatesWithStage,
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

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const candidate = await Candidate.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'lastOperator',
          attributes: ['id', 'username', 'realName']
        },
        {
          model: CandidateStage,
          attributes: ['currentStage', 'consultantId'],
          include: [
            {
              model: User,
              as: 'consultant',
              attributes: ['id', 'username', 'realName']
            }
          ]
        }
      ]
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const interview = await Interview.findOne({
      where: { candidateId: candidate.id },
      include: [
        {
          model: BusinessLine,
          as: 'BusinessLine',
          attributes: ['id', 'name']
        },
        {
          model: InterviewRound,
          as: 'rounds'
        }
      ]
    });

    let businessLineDetails = null;
    if (interview) {
      const businessLine = interview.BusinessLine;
      const rounds = interview.rounds || [];
      if (businessLine) {
        const candidateStage = await StageService.getStage(interview.candidateId);
        const stage = candidateStage ? candidateStage.currentStage : 'candidate_entry';
        businessLineDetails = {
          id: businessLine.id,
          name: businessLine.name,
          through: {
            id: interview.id,
            businessLineId: interview.businessLineId,
            interviewStage: stage,
            currentStage: stage,
            currentStatus: interview.currentStatus
          }
        };
      }
    }

    const candidateObj = candidate.toJSON();
    if (candidate.lastOperator) {
      candidateObj.lastOperator = candidate.lastOperator.toJSON();
    }
    candidateObj.businessLines = businessLineDetails ? [businessLineDetails] : [];
    
    if (candidate.CandidateStage) {
      candidateObj.currentStage = candidate.CandidateStage.currentStage;
      if (candidate.CandidateStage.consultant) {
        candidateObj.consultant = candidate.CandidateStage.consultant.toJSON();
      }
    }

    res.json({ candidate: candidateObj });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      gender,
      idCard,
      consultantId,
      businessLines
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!gender) {
      return res.status(400).json({ error: 'Gender is required' });
    }
    if (!phone) {
      return res.status(400).json({ error: 'Phone is required' });
    }
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    if (!idCard) {
      return res.status(400).json({ error: 'ID card is required' });
    }

    if (idCard) {
      const existingCandidate = await Candidate.findOne({ where: { idCard } });
      if (existingCandidate) {
        return res.status(400).json({ error: 'Candidate with this ID card already exists' });
      }
    }

    if (phone) {
      const existingCandidate = await Candidate.findOne({ where: { phone } });
      if (existingCandidate) {
        return res.status(400).json({ error: 'Candidate with this phone number already exists' });
      }
    }

    const candidate = await Candidate.create({
      name,
      email,
      phone,
      gender,
      idCard,
      lastOperatorId: req.user.id
    });

    await StageService.initStage(candidate.id, 'candidate_entry', req.user.id, consultantId);

    if (businessLines && Array.isArray(businessLines) && businessLines.length > 0) {
      const pl = businessLines[0];
      const interview = await Interview.create({
        candidateId: candidate.id,
        businessLineId: pl.businessLineId,
        currentStatus: 'progressing'
      });
      
      // 初始化 recommend_interview 阶段数据
      await InterviewRound.findOrCreate({
        where: {
          interviewId: interview.id,
          stageCode: 'recommend_interview'
        },
        defaults: {
          stageIndex: STAGES.indexOf('recommend_interview'),
          scheduledDate: new Date(),
          currentStatus: 'pending_filter'
        }
      });
    }

    await candidate.reload();

    res.status(201).json({
      message: 'Candidate created successfully',
      candidate
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const candidate = await Candidate.findByPk(req.params.id);

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const { businessLines, ...basicInfo } = req.body;

    if (!basicInfo.name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!basicInfo.gender) {
      return res.status(400).json({ error: 'Gender is required' });
    }
    if (!basicInfo.phone) {
      return res.status(400).json({ error: 'Phone is required' });
    }
    if (!basicInfo.email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    if (!basicInfo.idCard) {
      return res.status(400).json({ error: 'ID card is required' });
    }

    if (basicInfo.idCard && basicInfo.idCard !== candidate.idCard) {
      const existingCandidate = await Candidate.findOne({ where: { idCard: basicInfo.idCard } });
      if (existingCandidate) {
        return res.status(400).json({ error: 'Candidate with this ID card already exists' });
      }
    }

    if (basicInfo.phone && basicInfo.phone !== candidate.phone) {
      const existingCandidate = await Candidate.findOne({ where: { phone: basicInfo.phone } });
      if (existingCandidate) {
        return res.status(400).json({ error: 'Candidate with this phone number already exists' });
      }
    }

    const allowedFields = ['name', 'email', 'phone', 'gender', 'idCard', 'consultantId'];
    const updateData = {
      lastOperatorId: req.user.id
    };
    for (const field of allowedFields) {
      if (basicInfo[field] !== undefined) {
        updateData[field] = basicInfo[field];
      }
    }

    await candidate.update(updateData);

    if (businessLines && Array.isArray(businessLines)) {
      const existingInterview = await Interview.findOne({
        where: { candidateId: candidate.id }
      });

      if (businessLines.length > 0) {
        const pl = businessLines[0];
        if (existingInterview) {
          await existingInterview.update({
            businessLineId: pl.businessLineId !== undefined ? pl.businessLineId : existingInterview.businessLineId,
            currentStatus: pl.currentStatus !== undefined ? pl.currentStatus : existingInterview.currentStatus
          });
          if (pl.currentStage) {
            await StageService.updateStage(candidate.id, pl.currentStage, req.user.id);
          }
        } else {
          const interview = await Interview.create({
            candidateId: candidate.id,
            businessLineId: pl.businessLineId,
            currentStatus: 'progressing'
          });
          if (pl.currentStage) {
            await StageService.updateStage(candidate.id, pl.currentStage, req.user.id);
          }
          
          // 初始化 recommend_interview 阶段数据
          await InterviewRound.findOrCreate({
            where: {
              interviewId: interview.id,
              stageCode: 'recommend_interview'
            },
            defaults: {
              stageIndex: STAGES.indexOf('recommend_interview'),
              scheduledDate: new Date(),
              currentStatus: 'pending_filter'
            }
          });
        }
      } else if (existingInterview) {
        await existingInterview.destroy();
      }
    }

    await candidate.reload();

    res.json({
      message: 'Candidate updated successfully',
      candidate
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/advance', authenticate, async (req, res, next) => {
  try {
    const candidate = await Candidate.findByPk(req.params.id);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const candidateStage = await StageService.getStage(candidate.id);
    const currentStage = candidateStage ? candidateStage.currentStage : 'candidate_entry';
    const currentIndex = STAGES.indexOf(currentStage);
    if (currentIndex === -1 || currentIndex >= STAGES.length - 1) {
      return res.status(400).json({ error: 'Candidate already at final stage' });
    }

    const nextStage = STAGES[currentIndex + 1];
    await StageService.updateStage(candidate.id, nextStage, req.user.id);

    if (nextStage === 'test_declare') {
      await Test.findOrCreate({
        where: { candidateId: candidate.id },
        defaults: {
          issueDate: new Date(),
          currentStatus: 'pending'
        }
      });
    }

    if (nextStage === 'pending_onboarding') {
      const interviewWithPL = await Interview.findOne({
        where: { candidateId: candidate.id }
      });

      if (interviewWithPL && interviewWithPL.businessLineId) {
        await Employee.findOrCreate({
          where: {
            candidateId: candidate.id,
            businessLineId: interviewWithPL.businessLineId
          },
          defaults: {
            updatedBy: req.user.id
          }
        });
      }
    }

    res.json({
      message: 'Candidate advanced to next stage',
      candidate
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/rollback', authenticate, async (req, res, next) => {
  try {
    const candidate = await Candidate.findByPk(req.params.id);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const candidateStage = await StageService.getStage(candidate.id);
    const currentStage = candidateStage ? candidateStage.currentStage : 'candidate_entry';
    const currentIndex = STAGES.indexOf(currentStage);
    if (currentIndex <= 0) {
      return res.status(400).json({ error: 'Candidate already at first stage' });
    }

    const prevStage = STAGES[currentIndex - 1];
    await StageService.updateStage(candidate.id, prevStage, req.user.id);

    res.json({
      message: 'Candidate rolled back to previous stage',
      candidate
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const candidate = await Candidate.findByPk(req.params.id);

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    await Interview.destroy({ where: { candidateId: candidate.id } });
    await StageService.deleteStage(candidate.id);

    await candidate.destroy();

    res.json({ message: 'Candidate deleted successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/can-recommend', authenticate, async (req, res, next) => {
  try {
    const candidate = await Candidate.findByPk(req.params.id);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const candidateStage = await StageService.getStage(candidate.id);
    const currentStage = candidateStage ? candidateStage.currentStage : 'candidate_entry';

    if (currentStage !== 'test_complete') {
      return res.json({ canRecommend: false, reason: '当前阶段不是韧测完成，不能面推' });
    }

    const existingInterview = await Interview.findOne({
      where: { candidateId: candidate.id }
    });

    if (existingInterview) {
      return res.json({ canRecommend: false, reason: '已存在面试记录，只能面推一次' });
    }

    return res.json({ canRecommend: true, reason: '可以面推' });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/available-business-lines', authenticate, async (req, res, next) => {
  try {
    const candidate = await Candidate.findByPk(req.params.id);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const allBusinessLines = await BusinessLine.findAll({ where: { isActive: true } });

    const existingInterview = await Interview.findOne({
      where: { candidateId: candidate.id }
    });

    const usedBusinessLineId = existingInterview?.businessLineId;

    const availableBusinessLines = allBusinessLines
      .filter(pl => pl.id !== usedBusinessLineId)
      .map(pl => ({
        id: pl.id,
        name: pl.name
      }));

    res.json({ businessLines: availableBusinessLines });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/push-interview', authenticate, async (req, res, next) => {
  const { sequelize } = require('../models');
  const transaction = await sequelize.transaction();

  try {
    const candidate = await Candidate.findByPk(req.params.id);
    if (!candidate) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const candidateStage = await StageService.getStage(candidate.id);
    const currentStage = candidateStage ? candidateStage.currentStage : 'candidate_entry';
    if (currentStage === 'entry' || currentStage === 'leave') {
      await transaction.rollback();
      return res.status(400).json({ error: '候选人已入职或离职，不能面推' });
    }

    const existingInterview = await Interview.findOne({
      where: { candidateId: candidate.id }
    });

    if (existingInterview) {
      await transaction.rollback();
      return res.status(400).json({ error: '该候选人已有面试记录' });
    }

    const today = new Date();
    
    const interview = await Interview.create({
      candidateId: candidate.id,
      currentStatus: 'pending'
    }, { transaction });

    await InterviewRound.create({
      interviewId: interview.id,
      stageCode: 'recommend_interview',
      stageIndex: 0,
      scheduledDate: today,
      currentStatus: 'pending_filter'
    }, { transaction });

    await StageService.updateStage(candidate.id, 'recommend_interview', req.user.id, transaction);

    await transaction.commit();

    res.json({
      message: '面推成功'
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
});

module.exports = router;
