const express = require('express');
const { Op } = require('sequelize');
const { Candidate, User, ProductLine, ExamPaper, TestType, CandidateProductLine, Interview } = require('../models');
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

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { name, currentStage, productLineId, startDate, endDate, examPassed, testPassed, page = 1, pageSize = 20 } = req.query;

    const candidates = await Candidate.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'lastOperator',
          attributes: ['id', 'username', 'realName']
        }
      ]
    });

    const candidatesWithProductLines = await Promise.all(
      candidates.map(async (candidate) => {
        const productLines = await CandidateProductLine.findAll({
          where: { candidateId: candidate.id },
          include: [
            {
              model: Interview,
              attributes: [
                'qualificationInterviewDate', 'qualificationInterviewer', 'qualificationConclusion', 'qualificationPassed',
                'techInterview1Date', 'techInterview1Interviewer', 'techInterview1Content', 'techInterview1Passed',
                'techInterview2Date', 'techInterview2Interviewer', 'techInterview2Content', 'techInterview2Passed',
                'managerInterviewDate', 'managerInterviewer', 'managerInterviewContent', 'managerInterviewPassed',
                'approvalDate', 'approver', 'approvalRemark', 'approvalPassed',
                'offerDate', 'offerApprover', 'offerRemark'
              ]
            }
          ]
        });

        const productLineDetails = [];
        for (const pl of productLines) {
          const productLine = await ProductLine.findByPk(pl.productLineId);
          if (productLine) {
            const interview = pl.Interview || {};
            productLineDetails.push({
              id: productLine.id,
              name: productLine.name,
              clientOwner: productLine.clientOwner,
              through: {
                id: pl.id,
                productLineId: pl.productLineId,
                interviewStage: pl.interviewStage,
                recommendDate: pl.recommendDate,
                qualificationInterviewDate: interview.qualificationInterviewDate,
                qualificationInterviewer: interview.qualificationInterviewer,
                qualificationConclusion: interview.qualificationConclusion,
                qualificationPassed: interview.qualificationPassed,
                techInterview1Date: interview.techInterview1Date,
                techInterview1Interviewer: interview.techInterview1Interviewer,
                techInterview1Content: interview.techInterview1Content,
                techInterview1Passed: interview.techInterview1Passed,
                techInterview2Date: interview.techInterview2Date,
                techInterview2Interviewer: interview.techInterview2Interviewer,
                techInterview2Content: interview.techInterview2Content,
                techInterview2Passed: interview.techInterview2Passed,
                managerInterviewDate: interview.managerInterviewDate,
                managerInterviewer: interview.managerInterviewer,
                managerInterviewContent: interview.managerInterviewContent,
                managerInterviewPassed: interview.managerInterviewPassed,
                approvalDate: interview.approvalDate,
                approver: interview.approver,
                approvalRemark: interview.approvalRemark,
                approvalPassed: interview.approvalPassed,
                offerDate: interview.offerDate,
                offerApprover: interview.offerApprover,
                offerRemark: interview.offerRemark
              }
            });
          }
        }

        const candidateObj = candidate.toJSON();
        if (candidate.lastOperator) {
          candidateObj.lastOperator = candidate.lastOperator.toJSON();
        }
        candidateObj.productLines = productLineDetails;
        return candidateObj;
      })
    );

    let filteredCandidates = candidatesWithProductLines;
    
    if (name) {
      const nameLower = name.toLowerCase();
      filteredCandidates = filteredCandidates.filter(candidate => 
        candidate.name.toLowerCase().includes(nameLower)
      );
    }
    
    if (currentStage) {
      filteredCandidates = filteredCandidates.filter(candidate => {
        if (candidate.productLines && candidate.productLines.length > 0) {
          return candidate.productLines.some(productLine => 
            productLine.through.interviewStage === currentStage
          );
        } else {
          return candidate.currentStage === currentStage;
        }
      });
    }
    
    const filteredCount = filteredCandidates.length;

    res.json({
      candidates: filteredCandidates
    });
  } catch (error) {
    next(error);
  }
});

const EMPLOYEE_STAGES = ['entry', 'leave'];

router.get('/employees', authenticate, async (req, res, next) => {
  try {
    const { name, currentStage, page = 1, pageSize = 20 } = req.query;

    let whereClause = {
      currentStage: {
        [Op.in]: EMPLOYEE_STAGES
      }
    };

    if (currentStage && EMPLOYEE_STAGES.includes(currentStage)) {
      whereClause.currentStage = currentStage;
    }

    if (name) {
      whereClause.name = {
        [Op.like]: `%${name}%`
      };
    }

    const candidates = await Candidate.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'lastOperator',
          attributes: ['id', 'username', 'realName']
        }
      ],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize)
    });

    const total = await Candidate.count({ where: whereClause });

    const candidatesWithProductLines = await Promise.all(
      candidates.map(async (candidate) => {
        const productLines = await CandidateProductLine.findAll({
          where: { candidateId: candidate.id },
          include: [
            {
              model: Interview,
              attributes: [
                'qualificationInterviewDate', 'qualificationInterviewer', 'qualificationConclusion', 'qualificationPassed',
                'techInterview1Date', 'techInterview1Interviewer', 'techInterview1Content', 'techInterview1Passed',
                'techInterview2Date', 'techInterview2Interviewer', 'techInterview2Content', 'techInterview2Passed',
                'managerInterviewDate', 'managerInterviewer', 'managerInterviewContent', 'managerInterviewPassed',
                'approvalDate', 'approver', 'approvalRemark', 'approvalPassed',
                'offerDate', 'offerApprover', 'offerRemark'
              ]
            }
          ]
        });

        const productLineDetails = [];
        for (const pl of productLines) {
          const productLine = await ProductLine.findByPk(pl.productLineId);
          if (productLine) {
            const interview = pl.Interview || {};
            productLineDetails.push({
              id: productLine.id,
              name: productLine.name,
              clientOwner: productLine.clientOwner,
              through: {
                id: pl.id,
                productLineId: pl.productLineId,
                interviewStage: pl.interviewStage,
                recommendDate: pl.recommendDate,
                qualificationInterviewDate: interview.qualificationInterviewDate,
                qualificationInterviewer: interview.qualificationInterviewer,
                qualificationConclusion: interview.qualificationConclusion,
                qualificationPassed: interview.qualificationPassed,
                techInterview1Date: interview.techInterview1Date,
                techInterview1Interviewer: interview.techInterview1Interviewer,
                techInterview1Content: interview.techInterview1Content,
                techInterview1Passed: interview.techInterview1Passed,
                techInterview2Date: interview.techInterview2Date,
                techInterview2Interviewer: interview.techInterview2Interviewer,
                techInterview2Content: interview.techInterview2Content,
                techInterview2Passed: interview.techInterview2Passed,
                managerInterviewDate: interview.managerInterviewDate,
                managerInterviewer: interview.managerInterviewer,
                managerInterviewContent: interview.managerInterviewContent,
                managerInterviewPassed: interview.managerInterviewPassed,
                approvalDate: interview.approvalDate,
                approver: interview.approver,
                approvalRemark: interview.approvalRemark,
                approvalPassed: interview.approvalPassed,
                offerDate: interview.offerDate,
                offerApprover: interview.offerApprover,
                offerRemark: interview.offerRemark
              }
            });
          }
        }

        const candidateObj = candidate.toJSON();
        if (candidate.lastOperator) {
          candidateObj.lastOperator = candidate.lastOperator.toJSON();
        }
        candidateObj.productLines = productLineDetails;
        return candidateObj;
      })
    );

    res.json({
      candidates: candidatesWithProductLines,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
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
        }
      ]
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const productLines = await CandidateProductLine.findAll({
      where: { candidateId: candidate.id },
      include: [
        {
          model: Interview,
          attributes: [
            'qualificationInterviewDate', 'qualificationInterviewer', 'qualificationConclusion', 'qualificationPassed',
            'techInterview1Date', 'techInterview1Interviewer', 'techInterview1Content', 'techInterview1Passed',
            'techInterview2Date', 'techInterview2Interviewer', 'techInterview2Content', 'techInterview2Passed',
            'managerInterviewDate', 'managerInterviewer', 'managerInterviewContent', 'managerInterviewPassed',
            'approvalDate', 'approver', 'approvalRemark', 'approvalPassed',
            'offerDate', 'offerApprover', 'offerRemark'
          ]
        }
      ]
    });

    const productLineDetails = [];
    for (const pl of productLines) {
      const productLine = await ProductLine.findByPk(pl.productLineId);
      if (productLine) {
        const interview = pl.Interview || {};
        productLineDetails.push({
          id: productLine.id,
          name: productLine.name,
          clientOwner: productLine.clientOwner,
          through: {
            id: pl.id,
            productLineId: pl.productLineId,
            interviewStage: pl.interviewStage,
            recommendDate: pl.recommendDate,
            qualificationInterviewDate: interview.qualificationInterviewDate,
            qualificationInterviewer: interview.qualificationInterviewer,
            qualificationConclusion: interview.qualificationConclusion,
            qualificationPassed: interview.qualificationPassed,
            techInterview1Date: interview.techInterview1Date,
            techInterview1Interviewer: interview.techInterview1Interviewer,
            techInterview1Content: interview.techInterview1Content,
            techInterview1Passed: interview.techInterview1Passed,
            techInterview2Date: interview.techInterview2Date,
            techInterview2Interviewer: interview.techInterview2Interviewer,
            techInterview2Content: interview.techInterview2Content,
            techInterview2Passed: interview.techInterview2Passed,
            managerInterviewDate: interview.managerInterviewDate,
            managerInterviewer: interview.managerInterviewer,
            managerInterviewContent: interview.managerInterviewContent,
            managerInterviewPassed: interview.managerInterviewPassed,
            approvalDate: interview.approvalDate,
            approver: interview.approver,
            approvalRemark: interview.approvalRemark,
            approvalPassed: interview.approvalPassed,
            offerDate: interview.offerDate,
            offerApprover: interview.offerApprover,
            offerRemark: interview.offerRemark
          }
        });
      }
    }

    const candidateObj = candidate.toJSON();
    if (candidate.lastOperator) {
      candidateObj.lastOperator = candidate.lastOperator.toJSON();
    }
    candidateObj.productLines = productLineDetails;

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
      productLines
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

    if (productLines && Array.isArray(productLines)) {
      for (const pl of productLines) {
        const newAssociation = await CandidateProductLine.create({
          candidateId: candidate.id,
          productLineId: pl.productLineId,
          interviewStage: 'employee_entry'
        });
        
        await Interview.create({
          candidateProductLineId: newAssociation.id
        });
      }
    }

    await candidate.reload({
      include: [
        {
          model: ProductLine,
          as: 'productLines',
          through: {
            attributes: ['id', 'productLineId', 'interviewStage', 'recommendDate']
          },
          attributes: ['id', 'name', 'clientOwner']
        }
      ]
    });

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

    const { productLines, entryDate, entryRemark, leaveDate, leaveReason, leaveRemark, ...basicInfo } = req.body;

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

    const allowedFields = ['name', 'email', 'phone', 'gender', 'idCard', 'currentStage'];
    const updateData = {
      lastOperatorId: req.user.id
    };
    for (const field of allowedFields) {
      if (basicInfo[field] !== undefined) {
        updateData[field] = basicInfo[field];
      }
    }

    if (entryDate !== undefined) updateData.entryDate = entryDate;
    if (entryRemark !== undefined) updateData.entryRemark = entryRemark;
    if (leaveDate !== undefined) updateData.leaveDate = leaveDate;
    if (leaveReason !== undefined) updateData.leaveReason = leaveReason;
    if (leaveRemark !== undefined) updateData.leaveRemark = leaveRemark;

    if (!updateData.currentStage) {
      if (leaveDate && !candidate.leaveDate) {
        updateData.currentStage = 'leave';
      } else if (!leaveDate && candidate.leaveDate) {
        updateData.currentStage = 'entry';
      }
    }

    await candidate.update(updateData);

    let maxStageIndex = -1;
    let latestStage = candidate.currentStage;

    if (productLines && Array.isArray(productLines)) {
      const existingAssociations = await CandidateProductLine.findAll({
        where: { candidateId: candidate.id }
      });

      const existingIds = new Set(existingAssociations.map(assoc => assoc.id));
      const incomingIds = new Set(productLines.filter(pl => pl.id).map(pl => pl.id));

      for (const pl of productLines) {
        if (pl.id) {
          const candidateProductLineData = {
            productLineId: pl.productLineId,
            recommendDate: pl.recommendDate,
            interviewStage: pl.interviewStage
          };
          
          await CandidateProductLine.update(candidateProductLineData, {
            where: { id: pl.id, candidateId: candidate.id }
          });
          
          const stageIndex = STAGES.indexOf(pl.interviewStage);
          if (stageIndex > maxStageIndex) {
            maxStageIndex = stageIndex;
            latestStage = pl.interviewStage;
          }
          
          const interviewData = {
            qualificationInterviewDate: pl.qualificationInterviewDate,
            qualificationInterviewer: pl.qualificationInterviewer,
            qualificationConclusion: pl.qualificationConclusion,
            qualificationPassed: pl.qualificationPassed,
            techInterview1Date: pl.techInterview1Date,
            techInterview1Interviewer: pl.techInterview1Interviewer,
            techInterview1Content: pl.techInterview1Content,
            techInterview1Passed: pl.techInterview1Passed,
            techInterview2Date: pl.techInterview2Date,
            techInterview2Interviewer: pl.techInterview2Interviewer,
            techInterview2Content: pl.techInterview2Content,
            techInterview2Passed: pl.techInterview2Passed,
            managerInterviewDate: pl.managerInterviewDate,
            managerInterviewer: pl.managerInterviewer,
            managerInterviewContent: pl.managerInterviewContent,
            managerInterviewPassed: pl.managerInterviewPassed,
            approvalDate: pl.approvalDate,
            approver: pl.approver,
            approvalRemark: pl.approvalRemark,
            approvalPassed: pl.approvalPassed,
            offerDate: pl.offerDate,
            offerApprover: pl.offerApprover,
            offerRemark: pl.offerRemark
          };
          
          await Interview.upsert({
            candidateProductLineId: pl.id,
            ...interviewData
          });
          
          existingIds.delete(pl.id);
        } else {
          const newAssociation = await CandidateProductLine.create({
            candidateId: candidate.id,
            productLineId: pl.productLineId,
            interviewStage: pl.interviewStage || 'recommend_interview',
            recommendDate: pl.recommendDate
          });
          
          await Interview.create({
            candidateProductLineId: newAssociation.id,
            qualificationInterviewDate: pl.qualificationInterviewDate,
            qualificationInterviewer: pl.qualificationInterviewer,
            qualificationConclusion: pl.qualificationConclusion,
            qualificationPassed: pl.qualificationPassed,
            techInterview1Date: pl.techInterview1Date,
            techInterview1Interviewer: pl.techInterview1Interviewer,
            techInterview1Content: pl.techInterview1Content,
            techInterview1Passed: pl.techInterview1Passed,
            techInterview2Date: pl.techInterview2Date,
            techInterview2Interviewer: pl.techInterview2Interviewer,
            techInterview2Content: pl.techInterview2Content,
            techInterview2Passed: pl.techInterview2Passed,
            managerInterviewDate: pl.managerInterviewDate,
            managerInterviewer: pl.managerInterviewer,
            managerInterviewContent: pl.managerInterviewContent,
            managerInterviewPassed: pl.managerInterviewPassed,
            approvalDate: pl.approvalDate,
            approver: pl.approver,
            approvalRemark: pl.approvalRemark,
            approvalPassed: pl.approvalPassed,
            offerDate: pl.offerDate,
            offerApprover: pl.offerApprover,
            offerRemark: pl.offerRemark
          });
        }
      }

      for (const id of existingIds) {
        await Interview.destroy({ where: { candidateProductLineId: id } });
        await CandidateProductLine.destroy({ where: { id } });
      }
    }

    if (maxStageIndex >= 0 && latestStage !== candidate.currentStage) {
      await candidate.update({ 
        currentStage: latestStage,
        lastOperatorId: req.user.id 
      });
    }

    await candidate.reload({
      include: [
        {
          model: ProductLine,
          as: 'productLines',
          through: {
            attributes: ['id', 'productLineId', 'interviewStage', 'recommendDate']
          },
          attributes: ['id', 'name', 'clientOwner']
        }
      ]
    });

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
    const { productLineId, entryDate, entryRemark } = req.body;

    if (productLineId) {
      const candidateProductLine = await CandidateProductLine.findOne({
        where: {
          candidateId: req.params.id,
          productLineId
        }
      });

      if (!candidateProductLine) {
        return res.status(404).json({ error: 'Candidate-product line association not found' });
      }

      const currentIndex = STAGES.indexOf(candidateProductLine.interviewStage);
      if (currentIndex === -1 || currentIndex >= STAGES.length - 1) {
        return res.status(400).json({ error: 'Candidate already at final stage for this product line' });
      }

      const nextStage = STAGES[currentIndex + 1];
      await candidateProductLine.update({ interviewStage: nextStage });
      
      const candidate = await Candidate.findByPk(req.params.id);
      if (nextStage === 'entry') {
        const updateData = { currentStage: nextStage, lastOperatorId: req.user.id };
        if (entryDate) updateData.entryDate = entryDate;
        if (entryRemark) updateData.entryRemark = entryRemark;
        await candidate.update(updateData);
        
        await CandidateProductLine.update(
          { interviewStage: 'entry' },
          { where: { candidateId: req.params.id } }
        );
      } else {
        await candidate.update({ currentStage: nextStage, lastOperatorId: req.user.id });
      }

      res.json({
        message: 'Candidate advanced to next stage',
        candidateProductLine
      });
    } else {
      const candidate = await Candidate.findByPk(req.params.id);
      if (!candidate) {
        return res.status(404).json({ error: 'Candidate not found' });
      }

      const currentIndex = STAGES.indexOf(candidate.currentStage || 'employee_entry');
      if (currentIndex === -1 || currentIndex >= STAGES.length - 1) {
        return res.status(400).json({ error: 'Candidate already at final stage' });
      }

      const nextStage = STAGES[currentIndex + 1];
      await candidate.update({
        currentStage: nextStage,
        lastOperatorId: req.user.id
      });

      res.json({
        message: 'Candidate advanced to next stage',
        candidate
      });
    }
  } catch (error) {
    next(error);
  }
});

router.put('/:id/rollback', authenticate, async (req, res, next) => {
  try {
    const { productLineId } = req.body;

    if (productLineId) {
      const candidateProductLine = await CandidateProductLine.findOne({
        where: {
          candidateId: req.params.id,
          productLineId
        }
      });

      if (!candidateProductLine) {
        return res.status(404).json({ error: 'Candidate-product line association not found' });
      }

      const currentIndex = STAGES.indexOf(candidateProductLine.interviewStage);
      if (currentIndex <= 0) {
        return res.status(400).json({ error: 'Candidate already at first stage for this product line' });
      }

      const prevStage = STAGES[currentIndex - 1];
      await candidateProductLine.update({ interviewStage: prevStage });
      
      await Candidate.update(
        { lastOperatorId: req.user.id },
        { where: { id: req.params.id } }
      );

      res.json({
        message: 'Candidate rolled back to previous stage',
        candidateProductLine
      });
    } else {
      const candidate = await Candidate.findByPk(req.params.id);
      if (!candidate) {
        return res.status(404).json({ error: 'Candidate not found' });
      }

      const currentIndex = STAGES.indexOf(candidate.currentStage || 'employee_entry');
      if (currentIndex <= 0) {
        return res.status(400).json({ error: 'Candidate already at first stage' });
      }

      const prevStage = STAGES[currentIndex - 1];
      await candidate.update({
        currentStage: prevStage,
        lastOperatorId: req.user.id
      });

      res.json({
        message: 'Candidate rolled back to previous stage',
        candidate
      });
    }
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

    await Candidate.update(
      { lastOperatorId: req.user.id },
      { where: { id: candidate.id } }
    );

    const associations = await CandidateProductLine.findAll({ where: { candidateId: candidate.id } });
    for (const assoc of associations) {
      await Interview.destroy({ where: { candidateProductLineId: assoc.id } });
    }
    await CandidateProductLine.destroy({ where: { candidateId: candidate.id } });

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

    const blockedStages = ['recommend_interview', 'offer', 'entry', 'leave'];
    if (blockedStages.includes(candidate.currentStage)) {
      return res.json({ canRecommend: false, reason: '候选人当前阶段不允许面推' });
    }

    const productLines = await ProductLine.findAll({ where: { isActive: true } });
    if (!productLines || productLines.length === 0) {
      return res.json({ canRecommend: false, reason: '没有可用的产品线' });
    }

    const existingAssociations = await CandidateProductLine.findAll({
      where: { candidateId: candidate.id },
      include: [{ model: Interview }]
    });

    if (existingAssociations.length === 0) {
      const availableProductLines = productLines.map(pl => ({
        id: pl.id,
        name: pl.name,
        clientOwner: pl.clientOwner
      }));
      return res.json({ canRecommend: true, reason: '没有面试记录，可以面推', availableProductLines });
    }

    const hasPassedRecord = existingAssociations.some(assoc => {
      const stage = assoc.interviewStage;
      
      const interview = assoc.Interview;
      if (!interview) return false;
      
      const stageOrder = ['qualification_interview', 'tech_interview_1', 'tech_interview_2', 'manager_interview', 'approval'];
      const stageIndex = stageOrder.indexOf(stage);
      
      if (stageIndex === -1) return false;
      
      const passedFields = [
        'qualificationPassed',
        'techInterview1Passed',
        'techInterview2Passed',
        'managerInterviewPassed',
        'approvalPassed'
      ];
      
      const currentPassedField = passedFields[stageIndex];
      return interview[currentPassedField] === true;
    });

    if (hasPassedRecord) {
      return res.json({ canRecommend: false, reason: '存在通过的面试记录，不能面推' });
    }

    const usedProductLineIds = existingAssociations.map(assoc => assoc.productLineId);
    const availableProductLines = productLines
      .filter(pl => !usedProductLineIds.includes(pl.id))
      .map(pl => ({
        id: pl.id,
        name: pl.name,
        clientOwner: pl.clientOwner
      }));
    
    if (availableProductLines.length === 0) {
      return res.json({ canRecommend: false, reason: '所有产品线都已有面试记录' });
    }
    
    return res.json({ canRecommend: true, reason: '所有面试记录未通过，可以面推到其他产品线', availableProductLines });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/available-product-lines', authenticate, async (req, res, next) => {
  try {
    const candidate = await Candidate.findByPk(req.params.id);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const allProductLines = await ProductLine.findAll({ where: { isActive: true } });

    const existingAssociations = await CandidateProductLine.findAll({
      where: { candidateId: candidate.id }
    });

    const usedProductLineIds = existingAssociations.map(assoc => assoc.productLineId);

    const availableProductLines = allProductLines
      .filter(pl => !usedProductLineIds.includes(pl.id))
      .map(pl => ({
        id: pl.id,
        name: pl.name,
        clientOwner: pl.clientOwner
      }));

    res.json({ productLines: availableProductLines });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/push-interview', authenticate, async (req, res, next) => {
  const { sequelize } = require('../models');
  const transaction = await sequelize.transaction();
  
  try {
    const { productLineId, recommendDate } = req.body;

    if (!productLineId) {
      await transaction.rollback();
      return res.status(400).json({ error: '请选择产品线' });
    }

    if (!recommendDate) {
      await transaction.rollback();
      return res.status(400).json({ error: '请选择推荐日期' });
    }

    const candidate = await Candidate.findByPk(req.params.id);
    if (!candidate) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Candidate not found' });
    }

    if (candidate.currentStage === 'entry' || candidate.currentStage === 'leave') {
      await transaction.rollback();
      return res.status(400).json({ error: '候选人已入职或离职，不能面推' });
    }

    const existingAssociation = await CandidateProductLine.findOne({
      where: {
        candidateId: candidate.id,
        productLineId
      }
    });

    if (existingAssociation) {
      await transaction.rollback();
      return res.status(400).json({ error: '该候选人已在该产品线有面试记录' });
    }

    const newAssociation = await CandidateProductLine.create({
      candidateId: candidate.id,
      productLineId,
      recommendDate,
      interviewStage: 'recommend_interview'
    }, { transaction });

    await Interview.create({
      candidateProductLineId: newAssociation.id
    }, { transaction });

    await candidate.update({
      currentStage: 'recommend_interview',
      lastOperatorId: req.user.id
    }, { transaction });

    await transaction.commit();

    res.json({
      message: '面推成功',
      candidateProductLine: newAssociation
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
});

module.exports = router;