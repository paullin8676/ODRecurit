
const express = require('express');
const { Interview, InterviewRound, StageConfig, Candidate, CandidateStage, Employee, BusinessLine, User } = require('../models');
const { authenticate } = require('../middleware/auth');
const dataPermission = require('../middleware/dataPermission');
const StageService = require('../services/stageService');
const CandidateStageTimelineService = require('../services/CandidateStageTimelineService');

const router = express.Router();

const INTERVIEW_STAGES = [
  'recommend_interview',
  'qualification_interview',
  'tech_interview_1',
  'tech_interview_2',
  'manager_interview',
  'approval',
  'offer',
  'pending_onboarding'
];

const STAGE_NAMES = {
  recommend_interview: '推荐面试',
  qualification_interview: '资面安排',
  tech_interview_1: '技术面试(一)',
  tech_interview_2: '技术面试(二)',
  manager_interview: '主管面试',
  approval: '租用审批',
  offer: 'Offer',
  pending_onboarding: '待入职',
  entry: '入职',
  leave: '离职'
};

// Helper function to update interview currentStatus based on all rounds
const updateInterviewStatus = async (interviewId) => {
  const interview = await Interview.findByPk(interviewId, {
    include: [{ model: InterviewRound, as: 'rounds' }]
  });
  
  if (!interview) return;

  const rounds = interview.rounds || [];
  
  const candidateStage = await StageService.getStage(interview.candidateId);
  const currentStage = candidateStage ? candidateStage.currentStage : 'candidate_entry';
  
  // 如果已入职或离职，保持当前状态不变
  if (currentStage === 'entry' || currentStage === 'leave') {
    return;
  }

  let newStatus = 'progressing'; // 默认进行中

  // 检查是否有任何阶段失败（放弃或未通过）- 在 pending_onboarding 之前的所有阶段
  const PENDING_ONBOARDING_INDEX = INTERVIEW_STAGES.indexOf('pending_onboarding');
  const failedStatuses = ['failed', 'abandoned'];
  
  const hasFailed = rounds.some(round => {
    const stageIndex = INTERVIEW_STAGES.indexOf(round.stageCode);
    return stageIndex < PENDING_ONBOARDING_INDEX && failedStatuses.includes(round.currentStatus);
  });

  if (hasFailed) {
    newStatus = 'failed';
  } else {
    // 检查 offer 阶段是否通过
    const offerRound = rounds.find(r => r.stageCode === 'offer');
    if (offerRound && offerRound.currentStatus === 'passed') {
      newStatus = 'passed';
    }
  }

  if (interview.currentStatus !== newStatus) {
    console.log(`更新 Interview ${interviewId} 状态: ${interview.currentStatus} -> ${newStatus}`);
    await interview.update({ currentStatus: newStatus });
  }
};

// Helper function to sync employee when offer is accepted
const syncEmployeeOnOffer = async (interviewId, roundsData, operatorId) => {
  const interview = await Interview.findByPk(interviewId, {
    include: [
      { model: Candidate, as: 'Candidate' },
      { model: BusinessLine, as: 'BusinessLine' }
    ]
  });
  
  if (!interview || !interview.Candidate) return;

  // 查找offer阶段的数据
  const offerRoundData = roundsData.find(r => r.stageCode === 'offer');
  
  if (!offerRoundData) return;
  
  const candidate = interview.Candidate;
  const candidateId = candidate.id;
  
  if (!candidateId) {
    console.log(`候选人没有ID，无法同步employee`);
    return;
  }

  // 查找已有的employee，通过candidateId关联
  const employee = await Employee.findOne({ where: { candidateId: candidateId } });
  const candidateStage = await StageService.getStage(candidateId);
  const currentStage = candidateStage ? candidateStage.currentStage : null;
  
  if (offerRoundData.currentStatus === 'passed' && offerRoundData.entryDate) {
    if (employee) {
      // 如果状态是待入职或已入职，更新入职日期和业务线
      if (currentStage === 'pending_onboarding' || currentStage === 'entry') {
        await employee.update({
          entryDate: offerRoundData.entryDate,
          businessLineId: interview.businessLineId,
          updatedBy: operatorId
        });
        console.log(`更新 Employee ${employee.id} 入职日期`);
      }
      // 如果已离职，忽略
    } else {
      // 创建新的employee
      await Employee.create({
        candidateId: candidate.id,
        businessLineId: interview.businessLineId,
        entryDate: offerRoundData.entryDate,
        updatedBy: operatorId
      });
      console.log(`创建新 Employee 候选人ID: ${candidate.id}`);
    }
  } else if (offerRoundData.currentStatus === 'failed') {
    // 如果选择不接受，删除对应的employee记录（仅当状态为待入职时）
    if (employee && currentStage === 'pending_onboarding') {
      await employee.destroy();
      console.log(`删除 Employee ${employee.id}（候选人ID: ${candidate.id}）`);
    }
  }
};

// Helper function to transform interview data
const transformInterview = (interview, employee = null, currentStage = null, consultantName = '-') => {
  const baseData = interview.toJSON();
  
  const candidate = baseData.Candidate;
  const businessLine = baseData.BusinessLine;
  const businessLineId = businessLine ? businessLine.id : (baseData.businessLineId || null);

  const rounds = baseData.rounds || [];
  const roundsMap = {};
  rounds.forEach(round => {
    roundsMap[round.stageCode] = round;
    
    if (round.stageCode === 'offer' && employee) {
      if (employee.entryDate) {
        round.entryDate = employee.entryDate;
      }
      round.currentStatus = 'passed';
    }
  });

  return {
    ...baseData,
    businessLineId: businessLineId,
    rounds: rounds,
    roundsMap: roundsMap,
    currentStage: currentStage,
    employeeEntryDate: employee ? employee.entryDate : null,
    employeeLeaveDate: employee ? employee.leaveDate : null,
    consultantName: consultantName
  };
};

// Get all interviews
router.get('/', authenticate, dataPermission, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, currentStage, name, stages, passStatus } = req.query;
    const { Op } = require('sequelize');
    
    let availableStages = Object.keys(STAGE_NAMES);
    if (stages) {
      if (Array.isArray(stages)) {
        availableStages = stages;
      } else if (typeof stages === 'string') {
        availableStages = stages.split(',').map(s => s.trim()).filter(s => s);
      }
    } else {
      try {
        const stageConfig = await StageConfig.findOne({ where: { module: 'interview_management' } });
        if (stageConfig && stageConfig.config && stageConfig.config.stages && Array.isArray(stageConfig.config.stages)) {
          availableStages = stageConfig.config.stages;
        }
      } catch (e) {
      }
    }
    
    const whereClause = {};
    
    if (passStatus) {
      if (passStatus === 'progressing') {
        whereClause.currentStatus = {
          [Op.in]: ['progressing', 'pending']
        };
      } else {
        whereClause.currentStatus = passStatus;
      }
    }
    
    const candidateStageWhere = {};
    
    if (stages) {
      candidateStageWhere.currentStage = {
        [Op.in]: availableStages
      };
    }
    
    if (req.consultantIds && req.consultantIds.length > 0) {
      candidateStageWhere.consultantId = {
        [Op.in]: req.consultantIds
      };
    }
    
    const include = [
      {
        model: Candidate,
        as: 'Candidate',
        include: [
          {
            model: CandidateStage,
            as: 'CandidateStage',
            where: Object.keys(candidateStageWhere).length > 0 ? candidateStageWhere : undefined,
            required: Object.keys(candidateStageWhere).length > 0
          }
        ]
      },
      {
        model: BusinessLine,
        as: 'BusinessLine'
      },
      {
        model: InterviewRound,
        as: 'rounds'
      }
    ];
    
    // Add name filter to Candidate include
    if (name) {
      if (!include[0].where) {
        include[0].where = {};
      }
      include[0].where.name = {
        [require('sequelize').Op.like]: `%${name}%`
      };
      include[0].required = true;
    }
    
    // First pass: get all matching interviews without pagination for total count
    const allInterviews = await Interview.findAll({
      attributes: ['id'],
      where: whereClause,
      include: include
    });
    
    const totalCount = allInterviews.length;
    
    // Second pass: get paginated results
    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;
    
    const rows = await Interview.findAll({
      attributes: ['id', 'candidateId', 'businessLineId', 'currentStatus', 'createdAt', 'updatedAt'],
      where: whereClause,
      include: include,
      order: [['id', 'DESC']],
      limit,
      offset
    });
    
    let transformedInterviews = await Promise.all(rows.map(async (interview) => {
      const candidate = interview.Candidate;
      if (!candidate) return null;
      const candidateId = candidate.id;
      const employee = await Employee.findOne({ where: { candidateId: candidateId } });
      const candidateStage = await StageService.getStage(candidateId);
      const currentStage = candidateStage ? candidateStage.currentStage : null;
      const consultant = candidateStage && candidateStage.consultantId ? await User.findByPk(candidateStage.consultantId) : null;
      const consultantName = consultant ? consultant.realName : '-';
      return transformInterview(interview, employee, currentStage, consultantName);
    }));
    transformedInterviews = transformedInterviews.filter(i => i);
    
    // passStatus filter is now applied at database level in whereClause
    
    res.json({
      interviews: transformedInterviews,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: totalCount
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create or update interview with rounds
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { candidateId, businessLineId, rounds, currentStage, currentStatus } = req.body;
    
    if (!candidateId) {
      return res.status(400).json({ error: 'candidateId is required' });
    }
    
    // 检查该候选人是否已有面试记录（通过 UNIQUE 约束自动保证）
    const existingInterview = await Interview.findOne({
      where: { candidateId }
    });
    
    let interview;
    if (existingInterview) {
      // 更新现有面试
      interview = await existingInterview.update({
        businessLineId: businessLineId !== undefined ? businessLineId : existingInterview.businessLineId
      });
    } else {
      // 创建新面试
      interview = await Interview.create({
        candidateId,
        businessLineId,
        currentStatus: 'progressing'
      });
    }
    
    // 更新候选人阶段
    if (currentStage) {
      await StageService.updateStage(candidateId, currentStage, req.user?.id);
    }
    
    // 先更新所有的 rounds
    if (rounds && Array.isArray(rounds)) {
      for (const roundData of rounds) {
        const [round, roundCreated] = await InterviewRound.findOrCreate({
          where: {
            interviewId: interview.id,
            stageCode: roundData.stageCode
          },
          defaults: {
              stageIndex: INTERVIEW_STAGES.indexOf(roundData.stageCode),
              scheduledDate: roundData.scheduledDate,
              content: roundData.content,
              currentStatus: roundData.currentStatus,
              feedbackDate: roundData.feedbackDate,
              completedAt: roundData.completedAt,
              entryDate: roundData.entryDate
            }
          });
          
          if (!roundCreated) {
            await round.update({
              scheduledDate: roundData.scheduledDate,
              content: roundData.content,
              currentStatus: roundData.currentStatus,
              feedbackDate: roundData.feedbackDate,
              completedAt: roundData.completedAt,
              entryDate: roundData.entryDate
            });
          }
      }
    }
    
    // 使用 updateInterviewStatus 函数来智能更新面试状态
    await updateInterviewStatus(interview.id);

    const updatedInterview = await Interview.findByPk(interview.id, {
      attributes: ['id', 'candidateId', 'businessLineId', 'currentStatus', 'createdAt', 'updatedAt'],
      include: [
        {
          model: Candidate,
          as: 'Candidate'
        },
        {
          model: BusinessLine,
          as: 'BusinessLine'
        },
        {
          model: InterviewRound,
          as: 'rounds'
        }
      ]
    });

    const candidateStage = await StageService.getStage(candidateId);
    if (candidateStage) {
      await StageService.updateStage(candidateId, candidateStage.currentStage, req.user?.id);
    }
    
    if (rounds && Array.isArray(rounds)) {
      await syncEmployeeOnOffer(interview.id, rounds, req.user?.id);
    }
    
    const dbCurrentStage = candidateStage ? candidateStage.currentStage : null;
    const employee = candidateId ? await Employee.findOne({ where: { candidateId: candidateId } }) : null;
    
    res.json(transformInterview(updatedInterview, employee, dbCurrentStage));
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: '该候选人已有面试记录，不能重复创建' });
    }
    next(error);
  }
});

// Update interview with rounds
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { candidateId, businessLineId, rounds, currentStage, currentStatus } = req.body;

    console.log('=== Interview Update Request ===');
    console.log('interviewId:', id);
    console.log('rounds:', JSON.stringify(rounds, null, 2));

    const interview = await Interview.findByPk(id);
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    // 保存更新前的状态，用于后续判断是否需要同步候选人阶段
    const oldFinalStatus = interview.currentStatus;

    // 先更新所有的 rounds
    if (rounds && Array.isArray(rounds)) {
      for (const roundData of rounds) {
        console.log(`Processing round: ${roundData.stageCode}, currentStatus: ${roundData.currentStatus}`);
        
        const [round, roundCreated] = await InterviewRound.findOrCreate({
          where: {
            interviewId: interview.id,
            stageCode: roundData.stageCode
          },
          defaults: {
            stageIndex: INTERVIEW_STAGES.indexOf(roundData.stageCode),
            scheduledDate: roundData.scheduledDate,
            content: roundData.content,
            currentStatus: roundData.currentStatus,
            feedbackDate: roundData.feedbackDate,
            completedAt: roundData.completedAt,
            entryDate: roundData.entryDate
          }
        });

        if (!roundCreated) {
          console.log(`Updating existing round: ${roundData.stageCode}`);
          const updateData = {};
          if (roundData.scheduledDate !== undefined && roundData.scheduledDate !== null) {
            updateData.scheduledDate = roundData.scheduledDate;
          }
          if (roundData.content !== undefined && roundData.content !== null) {
            updateData.content = roundData.content;
          }
          if (roundData.currentStatus !== undefined && roundData.currentStatus !== null) {
            updateData.currentStatus = roundData.currentStatus;
          }
          if (roundData.feedbackDate !== undefined && roundData.feedbackDate !== null) {
            updateData.feedbackDate = roundData.feedbackDate;
          }
          if (roundData.completedAt !== undefined && roundData.completedAt !== null) {
            updateData.completedAt = roundData.completedAt;
          }
          if (roundData.entryDate !== undefined && roundData.entryDate !== null) {
            updateData.entryDate = roundData.entryDate;
          }
          if (Object.keys(updateData).length > 0) {
            await round.update(updateData);
          }
        }
      }
    }

    // 更新 Interview 基本信息
    await interview.update({
      businessLineId: businessLineId !== undefined ? businessLineId : interview.businessLineId
    });
    
    // 更新候选人阶段
    if (currentStage) {
      await StageService.updateStage(interview.candidateId, currentStage, req.user?.id);
    }
    
    // 使用 updateInterviewStatus 函数来智能更新面试状态
    await updateInterviewStatus(interview.id);

    const updatedInterview = await Interview.findByPk(interview.id, {
      attributes: ['id', 'candidateId', 'businessLineId', 'currentStatus', 'createdAt', 'updatedAt'],
      include: [
        {
          model: Candidate,
          as: 'Candidate'
        },
        {
          model: BusinessLine,
          as: 'BusinessLine'
        },
        {
          model: InterviewRound,
          as: 'rounds'
        }
      ]
    });

    // 获取候选人阶段
    const candidateStage = await StageService.getStage(interview.candidateId);
    
    // 当currentStatus发生变化时（比如变成failed或passed），需要同步候选人阶段
    if (oldFinalStatus !== updatedInterview.currentStatus && candidateStage) {
      await StageService.updateStage(interview.candidateId, candidateStage.currentStage, req.user?.id);
    }

    if (rounds && Array.isArray(rounds)) {
      await syncEmployeeOnOffer(interview.id, rounds, req.user?.id);
    }

    const dbCurrentStage = candidateStage ? candidateStage.currentStage : null;
    const employee = candidateId ? await Employee.findOne({ where: { candidateId: candidateId } }) : null;
    
    res.json(transformInterview(updatedInterview, employee, dbCurrentStage));
  } catch (error) {
    next(error);
  }
});

// Get interviews by candidate ID
router.get('/candidate/:candidateId', async (req, res, next) => {
  try {
    const { candidateId } = req.params;
    
    const interviews = await Interview.findAll({
      attributes: ['id', 'candidateId', 'businessLineId', 'currentStatus', 'createdAt', 'updatedAt'],
      where: { candidateId },
      include: [
        {
          model: Candidate,
          as: 'Candidate'
        },
        {
          model: BusinessLine,
          as: 'BusinessLine'
        },
        {
          model: InterviewRound,
          as: 'rounds'
        }
      ],
      order: [['id', 'DESC']]
    });
    
    const transformedInterviews = await Promise.all(interviews.map(async (interview) => {
      const candidate = interview.Candidate;
      if (!candidate) return null;
      const candidateStage = await StageService.getStage(candidate.id);
      const currentStage = candidateStage ? candidateStage.currentStage : null;
      return transformInterview(interview, null, currentStage);
    }));
    const filteredInterviews = transformedInterviews.filter(i => i);
    
    res.json({ interviews: filteredInterviews });
  } catch (error) {
    next(error);
  }
});

// Create or update a single interview round
router.post('/rounds', async (req, res, next) => {
  try {
    const { interviewId, stageCode, stageIndex, scheduledDate, content, currentStatus, feedbackDate, completedAt } = req.body;
    
    const [round, created] = await InterviewRound.findOrCreate({
      where: { interviewId, stageCode },
      defaults: {
        stageIndex: stageIndex !== undefined ? stageIndex : INTERVIEW_STAGES.indexOf(stageCode),
        scheduledDate,
        content,
        currentStatus,
        feedbackDate,
        completedAt
      }
    });
    
    if (!created) {
      await round.update({
        scheduledDate,
        content,
        currentStatus,
        feedbackDate,
        completedAt
      });
    }
    
    // 更新面试状态
    await updateInterviewStatus(interviewId);
    
    res.json(round);
  } catch (error) {
    next(error);
  }
});

// Update an interview round by ID
router.put('/rounds/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { scheduledDate, content, currentStatus, feedbackDate, completedAt } = req.body;
    
    const round = await InterviewRound.findByPk(id);
    if (!round) {
      return res.status(404).json({ error: 'Interview round not found' });
    }
    
    await round.update({
      scheduledDate,
      content,
      currentStatus,
      feedbackDate,
      completedAt
    });
    
    if (round.stageCode === 'recommend_interview' && feedbackDate) {
      const interview = await Interview.findByPk(round.interviewId);
      if (interview) {
        await CandidateStageTimelineService.setRecommendInterviewFeedbackDate(
          interview.candidateId,
          feedbackDate,
          req.user.id
        );
      }
    }
    
    // 更新面试状态
    await updateInterviewStatus(round.interviewId);
    
    res.json(round);
  } catch (error) {
    next(error);
  }
});

// Advance interview to next stage
router.post('/advance/:interviewId', async (req, res, next) => {
  try {
    const { interviewId } = req.params;
    const { currentStageData } = req.body;
    
    const interview = await Interview.findByPk(interviewId, {
      attributes: ['id', 'candidateId', 'businessLineId', 'currentStatus', 'createdAt', 'updatedAt'],
      include: [
        { model: InterviewRound, as: 'rounds' }
      ]
    });
    
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }
    
    // 如果面试状态为失败，不能推进
    if (interview.currentStatus === 'failed') {
      return res.status(400).json({ error: '面试已失败，不能推进' });
    }
    
    // 从 CandidateStage 获取当前阶段
    const candidateStage = await StageService.getStage(interview.candidateId);
    const currentStageFromDb = candidateStage ? candidateStage.currentStage : 'recommend_interview';
    
    const currentIndex = INTERVIEW_STAGES.indexOf(currentStageFromDb);
    const originalCurrentStage = currentStageFromDb;
    let nextStage;
    
    if (currentIndex < INTERVIEW_STAGES.length - 1) {
      nextStage = INTERVIEW_STAGES[currentIndex + 1];
      
      if (currentStageData && originalCurrentStage) {
        const [currentRound, created] = await InterviewRound.findOrCreate({
          where: {
            interviewId: interview.id,
            stageCode: originalCurrentStage
          },
          defaults: {
            stageIndex: currentIndex,
            scheduledDate: currentStageData.scheduledDate,
            content: currentStageData.content,
            currentStatus: currentStageData.currentStatus,
            feedbackDate: currentStageData.feedbackDate
          }
        });
        
        // 如果记录已存在，只更新非空字段
        if (!created) {
          const updateData = {};
          if (currentStageData.scheduledDate !== undefined) {
            updateData.scheduledDate = currentStageData.scheduledDate;
          }
          if (currentStageData.content !== undefined) {
            updateData.content = currentStageData.content;
          }
          if (currentStageData.currentStatus !== undefined) {
            updateData.currentStatus = currentStageData.currentStatus;
          }
          if (currentStageData.feedbackDate !== undefined) {
            updateData.feedbackDate = currentStageData.feedbackDate;
          }
          if (Object.keys(updateData).length > 0) {
            await currentRound.update(updateData);
          }
        }
      }
      
      // 更新候选人阶段
      await StageService.updateStage(interview.candidateId, nextStage, req.user?.id);

      // 注意：不再为下一阶段自动创建或初始化记录
      // 用户需要在编辑时自己填写 scheduledDate 和 currentStatus
      // 仅在记录完全不存在时创建空记录（不含默认值）
      const [nextRound] = await InterviewRound.findOrCreate({
        where: {
          interviewId: interview.id,
          stageCode: nextStage
        },
        defaults: {
          stageIndex: currentIndex + 1
          // 不设置 scheduledDate 和 currentStatus，让用户自己填写
        }
      });

      // 如果是从offer推进到pending_onboarding
      if (originalCurrentStage === 'offer') {
        const candidate = await Candidate.findByPk(interview.candidateId);
        if (candidate) {
          await Employee.findOrCreate({
            where: {
              candidateId: candidate.id,
              businessLineId: interview.businessLineId
            },
            defaults: {}
          });
        }
      }
    } else {
      const candidate = await Candidate.findByPk(interview.candidateId);
      if (candidate) {
        const [employee, created] = await Employee.findOrCreate({
          where: { candidateId: candidate.id },
          defaults: {
            businessLineId: interview.businessLineId
          }
        });
      }
    }
    
    // 更新面试状态
    await updateInterviewStatus(interview.id);
    
    // 同步候选人阶段（必须在 updateInterviewStatus 之后调用）
    await StageService.updateStage(interview.candidateId, nextStage, req.user?.id);
    
    const updatedInterview = await Interview.findByPk(interview.id, {
      attributes: ['id', 'candidateId', 'businessLineId', 'currentStatus', 'createdAt', 'updatedAt'],
      include: [
        {
          model: Candidate,
          as: 'Candidate'
        },
        {
          model: BusinessLine,
          as: 'BusinessLine'
        },
        {
          model: InterviewRound,
          as: 'rounds'
        }
      ]
    });
    
    const latestStage = await StageService.getStage(interview.candidateId);
    const dbCurrentStage = latestStage ? latestStage.currentStage : null;
    res.json(transformInterview(updatedInterview, null, dbCurrentStage));
  } catch (error) {
    next(error);
  }
});

// Delete interview
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const interview = await Interview.findByPk(id);
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }
    
    // 删除关联的面试轮次记录
    await InterviewRound.destroy({ where: { interviewId: id } });
    
    // 删除面试记录
    await interview.destroy();
    
    res.json({ message: 'Interview deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

