const express = require('express');
const { Interview, CandidateProductLine, InterviewRound, StageConfig, Candidate, Employee } = require('../models');

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

// Helper function to sync candidate current stage
const syncCandidateStage = async (candidateId) => {
  const candidateProductLines = await CandidateProductLine.findAll({
    where: { candidateId },
    include: [Interview]
  });

  let targetStage = 'test_complete';

  for (const cpl of candidateProductLines) {
    if (cpl.Interview) {
      if (cpl.Interview.finalStatus === 'passed') {
        targetStage = cpl.Interview.currentStage;
        break;
      } else if (cpl.Interview.finalStatus === 'pending' && targetStage === 'test_complete') {
        targetStage = cpl.Interview.currentStage;
      }
    }
  }

  await Candidate.update(
    { currentStage: targetStage },
    { where: { id: candidateId } }
  );
};

// Helper function to transform interview data
const transformInterview = (interview) => {
  const candidate = interview.candidateProductLine?.Candidate;
  const productLine = interview.candidateProductLine?.ProductLine;
  const recommendDate = interview.candidateProductLine?.recommendDate;
  const candidateProductLineId = interview.candidateProductLine?.id;
  const productLineId = interview.candidateProductLine?.productLineId;

  const rounds = interview.rounds || [];
  const roundsMap = {};
  rounds.forEach(round => {
    roundsMap[round.stageCode] = round;
  });

  return {
    ...interview.toJSON(),
    Candidate: candidate,
    productLine: productLine,
    productLineId: productLineId,
    candidateProductLineId: candidateProductLineId,
    recommendDate: recommendDate,
    clientOwner: productLine?.clientOwner || '',
    rounds: rounds,
    roundsMap: roundsMap
  };
};

// Get all interviews
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, currentStage, name, stages, passStatus } = req.query;
    
    let availableStages = Object.keys(STAGE_NAMES);
    // 优先使用前端传来的 stages 参数
    if (stages) {
      if (Array.isArray(stages)) {
        availableStages = stages;
      } else if (typeof stages === 'string') {
        availableStages = stages.split(',').map(s => s.trim()).filter(s => s);
      }
    } else {
      // 如果没有 stages 参数，从数据库读取配置
      try {
        const stageConfig = await StageConfig.findOne({ where: { module: 'interview_management' } });
        if (stageConfig && stageConfig.config && stageConfig.config.stages && Array.isArray(stageConfig.config.stages)) {
          availableStages = stageConfig.config.stages;
        }
      } catch (e) {
      }
    }
    
    const whereClause = {
      currentStage: {
        [require('sequelize').Op.in]: availableStages
      }
    };
    if (currentStage) {
      whereClause.currentStage = currentStage;
    }
    
    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;
    
    const { count, rows } = await Interview.findAndCountAll({
      attributes: ['id', 'candidateProductLineId', 'currentStage', 'finalStatus', 'createdAt', 'updatedAt'],
      where: whereClause,
      include: [
        {
          model: CandidateProductLine,
          as: 'candidateProductLine',
          include: ['Candidate', 'ProductLine']
        },
        {
          model: InterviewRound,
          as: 'rounds'
        }
      ],
      order: [['id', 'DESC']],
      limit,
      offset
    });
    
    let transformedInterviews = rows.map(transformInterview).filter(i => i.Candidate && i.productLine);
    
    // Apply name filter if provided
    if (name) {
      const nameLower = name.toLowerCase();
      transformedInterviews = transformedInterviews.filter(interview => 
        interview.Candidate && interview.Candidate.name && 
        interview.Candidate.name.toLowerCase().includes(nameLower)
      );
    }
    
    // Apply passStatus filter if provided
    if (passStatus === 'fail') {
      transformedInterviews = transformedInterviews.filter(interview => 
        interview.rounds && interview.rounds.some(round => round.passed === false)
      );
    } else if (passStatus === 'pass') {
      transformedInterviews = transformedInterviews.filter(interview => 
        !interview.rounds || !interview.rounds.some(round => round.passed === false)
      );
    }
    
    res.json({
      interviews: transformedInterviews,
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

// Create or update interview with rounds
router.post('/', async (req, res, next) => {
  try {
    const { candidateId, productLineId, recommendDate, rounds, currentStage, finalStatus } = req.body;
    
    let candidateProductLine = await CandidateProductLine.findOne({
      where: { candidateId, productLineId }
    });
    
    if (!candidateProductLine) {
      candidateProductLine = await CandidateProductLine.create({
        candidateId,
        productLineId,
        recommendDate
      });
    } else {
      await candidateProductLine.update({ recommendDate });
    }
    
    const [interview, created] = await Interview.findOrCreate({
      where: { candidateProductLineId: candidateProductLine.id },
      defaults: {
        currentStage: currentStage || 'recommend_interview',
        finalStatus: finalStatus || 'pending'
      }
    });
    
    if (!created) {
      await interview.update({
        currentStage: currentStage || interview.currentStage,
        finalStatus: finalStatus || interview.finalStatus
      });
    }
    
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
            interviewer: roundData.interviewer,
            content: roundData.content,
            passed: roundData.passed,
            completedAt: roundData.completedAt
          }
        });
        
        if (!roundCreated) {
          await round.update({
            scheduledDate: roundData.scheduledDate,
            interviewer: roundData.interviewer,
            content: roundData.content,
            passed: roundData.passed,
            completedAt: roundData.completedAt
          });
        }
      }
    }
    
    const updatedInterview = await Interview.findByPk(interview.id, {
      attributes: ['id', 'candidateProductLineId', 'currentStage', 'finalStatus', 'createdAt', 'updatedAt'],
      include: [
        {
          model: CandidateProductLine,
          as: 'candidateProductLine',
          include: ['Candidate', 'ProductLine']
        },
        {
          model: InterviewRound,
          as: 'rounds'
        }
      ]
    });

    await syncCandidateStage(candidateId);
    
    res.json(transformInterview(updatedInterview));
  } catch (error) {
    next(error);
  }
});

// Update interview with rounds
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { candidateId, productLineId, recommendDate, rounds, currentStage, finalStatus } = req.body;

    const interview = await Interview.findByPk(id);
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    let finalStatusToSet = interview.finalStatus;

    if (interview.finalStatus !== 'failed' && interview.finalStatus !== 'passed') {
      if (rounds && Array.isArray(rounds)) {
        let hasFailed = false;

        for (const roundData of rounds) {
          const [round, roundCreated] = await InterviewRound.findOrCreate({
            where: {
              interviewId: interview.id,
              stageCode: roundData.stageCode
            },
            defaults: {
              stageIndex: INTERVIEW_STAGES.indexOf(roundData.stageCode),
              scheduledDate: roundData.scheduledDate,
              interviewer: roundData.interviewer,
              content: roundData.content,
              passed: roundData.passed,
              completedAt: roundData.completedAt
            }
          });

          if (!roundCreated) {
            await round.update({
              scheduledDate: roundData.scheduledDate,
              interviewer: roundData.interviewer,
              content: roundData.content,
              passed: roundData.passed,
              completedAt: roundData.completedAt
            });
          }

          const passedValue = roundData.passed;
          if (passedValue === false || passedValue === 0) {
            hasFailed = true;
          }
        }

        if (hasFailed) {
          finalStatusToSet = 'failed';
        }
      }
    }

    const oldFinalStatus = interview.finalStatus;
    await interview.update({
      currentStage: currentStage || interview.currentStage,
      finalStatus: finalStatusToSet
    });

    const updatedInterview = await Interview.findByPk(interview.id, {
      attributes: ['id', 'candidateProductLineId', 'currentStage', 'finalStatus', 'createdAt', 'updatedAt'],
      include: [
        {
          model: CandidateProductLine,
          as: 'candidateProductLine',
          include: ['Candidate', 'ProductLine']
        },
        {
          model: InterviewRound,
          as: 'rounds'
        }
      ]
    });

    // 当finalStatus发生变化时（比如变成failed或passed），需要同步候选人阶段
    if (oldFinalStatus !== finalStatusToSet) {
      await syncCandidateStage(updatedInterview.candidateProductLine.candidateId);
    }

    res.json(transformInterview(updatedInterview));
  } catch (error) {
    next(error);
  }
});

// Get interviews by candidate ID
router.get('/candidate/:candidateId', async (req, res, next) => {
  try {
    const { candidateId } = req.params;
    const { productLineId } = req.query;
    
    const where = { candidateId };
    if (productLineId) {
      where.productLineId = productLineId;
    }
    
    const candidateProductLines = await CandidateProductLine.findAll({
      where,
      include: ['Candidate', 'ProductLine']
    });
    
    const candidateProductLineIds = candidateProductLines.map(cpl => cpl.id);
    const interviews = await Interview.findAll({
      attributes: ['id', 'candidateProductLineId', 'currentStage', 'finalStatus', 'createdAt', 'updatedAt'],
      where: { candidateProductLineId: candidateProductLineIds },
      include: [
        {
          model: CandidateProductLine,
          as: 'candidateProductLine',
          include: ['Candidate', 'ProductLine']
        },
        {
          model: InterviewRound,
          as: 'rounds'
        }
      ],
      order: [['id', 'DESC']]
    });
    
    const transformedInterviews = interviews.map(transformInterview).filter(i => i.Candidate && i.productLine);
    
    res.json({ interviews: transformedInterviews });
  } catch (error) {
    next(error);
  }
});

// Create or update a single interview round
router.post('/rounds', async (req, res, next) => {
  try {
    const { interviewId, stageCode, stageIndex, scheduledDate, interviewer, content, passed, completedAt } = req.body;
    
    const [round, created] = await InterviewRound.findOrCreate({
      where: { interviewId, stageCode },
      defaults: {
        stageIndex: stageIndex !== undefined ? stageIndex : INTERVIEW_STAGES.indexOf(stageCode),
        scheduledDate,
        interviewer,
        content,
        passed,
        completedAt
      }
    });
    
    if (!created) {
      await round.update({
        scheduledDate,
        interviewer,
        content,
        passed,
        completedAt
      });
    }
    
    res.json(round);
  } catch (error) {
    next(error);
  }
});

// Update an interview round by ID
router.put('/rounds/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { scheduledDate, interviewer, content, passed, completedAt } = req.body;
    
    const round = await InterviewRound.findByPk(id);
    if (!round) {
      return res.status(404).json({ error: 'Interview round not found' });
    }
    
    await round.update({
      scheduledDate,
      interviewer,
      content,
      passed,
      completedAt
    });
    
    res.json(round);
  } catch (error) {
    next(error);
  }
});

// Advance interview to next stage
router.post('/advance/:interviewId', async (req, res, next) => {
  try {
    const { interviewId } = req.params;
    
    const interview = await Interview.findByPk(interviewId, {
      attributes: ['id', 'candidateProductLineId', 'currentStage', 'finalStatus', 'createdAt', 'updatedAt'],
      include: [
        { model: InterviewRound, as: 'rounds' },
        { model: CandidateProductLine, as: 'candidateProductLine' }
      ]
    });
    
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }
    
    const currentIndex = INTERVIEW_STAGES.indexOf(interview.currentStage);
    const originalCurrentStage = interview.currentStage;
    let nextStage;
    
    if (currentIndex < INTERVIEW_STAGES.length - 1) {
      nextStage = INTERVIEW_STAGES[currentIndex + 1];
      await interview.update({ currentStage: nextStage });

      await InterviewRound.findOrCreate({
        where: {
          interviewId: interview.id,
          stageCode: nextStage
        },
        defaults: {
          stageIndex: currentIndex + 1
        }
      });

      if (interview.candidateProductLine) {
        await interview.candidateProductLine.update({ interviewStage: nextStage });
      }

      // 如果是从offer推进到pending_onboarding
      if (originalCurrentStage === 'offer') {
        await interview.update({ finalStatus: 'passed' });

        if (interview.candidateProductLine) {
          const candidate = await Candidate.findByPk(interview.candidateProductLine.candidateId);
          if (candidate) {
            await Employee.findOrCreate({
              where: {
                candidateId: candidate.id,
                productLineId: interview.candidateProductLine.productLineId
              },
              defaults: {
                name: candidate.name,
                email: candidate.email,
                phone: candidate.phone,
                gender: candidate.gender,
                idCard: candidate.idCard,
                lastOperatorId: candidate.lastOperatorId,
                currentStage: 'pending_onboarding'
              }
            });
          }
        }
      }
    } else {
      await interview.update({ finalStatus: 'passed' });

      if (interview.candidateProductLine) {
        await interview.candidateProductLine.update({ interviewStage: 'offer' });

        const candidate = await Candidate.findByPk(interview.candidateProductLine.candidateId);
        if (candidate) {
          const [employee, created] = await Employee.findOrCreate({
            where: { idCard: candidate.idCard },
            defaults: {
              name: candidate.name,
              email: candidate.email,
              phone: candidate.phone,
              gender: candidate.gender,
              idCard: candidate.idCard,
              lastOperatorId: candidate.lastOperatorId,
              currentStage: 'pending_onboarding'
            }
          });

          if (created) {
          }
        }
      }
    }
    
    const updatedInterview = await Interview.findByPk(interview.id, {
      attributes: ['id', 'candidateProductLineId', 'currentStage', 'finalStatus', 'createdAt', 'updatedAt'],
      include: [
        {
          model: CandidateProductLine,
          as: 'candidateProductLine',
          include: ['Candidate', 'ProductLine']
        },
        {
          model: InterviewRound,
          as: 'rounds'
        }
      ]
    });

    await syncCandidateStage(updatedInterview.candidateProductLine.candidateId);
    
    res.json(transformInterview(updatedInterview));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
