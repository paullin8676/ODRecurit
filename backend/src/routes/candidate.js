const express = require('express');
const { Candidate, User, ProductLine, ExamPaper, TestType, CandidateProductLine, Interview, Employee } = require('../models');
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

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { name, currentStage, page = 1, pageSize = 20 } = req.query;

    const candidates = await Candidate.findAll({
      order: [['created_at', 'DESC']],
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
              attributes: ['id', 'currentStage', 'finalStatus']
            }
          ]
        });

        const productLineDetails = [];
        for (const pl of productLines) {
          const productLine = await ProductLine.findByPk(pl.productLineId);
          if (productLine) {
            productLineDetails.push({
              id: productLine.id,
              name: productLine.name,
              clientOwner: productLine.clientOwner,
              through: {
                id: pl.id,
                productLineId: pl.productLineId,
                interviewStage: pl.interviewStage,
                recommendDate: pl.recommendDate,
                currentStage: pl.Interview?.currentStage,
                finalStatus: pl.Interview?.finalStatus
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

    const total = filteredCandidates.length;
    const startIndex = (parseInt(page) - 1) * parseInt(pageSize);
    const paginatedCandidates = filteredCandidates.slice(startIndex, startIndex + parseInt(pageSize));

    res.json({
      candidates: paginatedCandidates,
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
          attributes: ['id', 'currentStage', 'finalStatus']
        }
      ]
    });

    const productLineDetails = [];
    for (const pl of productLines) {
      const productLine = await ProductLine.findByPk(pl.productLineId);
      if (productLine) {
        productLineDetails.push({
          id: productLine.id,
          name: productLine.name,
          clientOwner: productLine.clientOwner,
          through: {
            id: pl.id,
            productLineId: pl.productLineId,
            interviewStage: pl.interviewStage,
            recommendDate: pl.recommendDate,
            currentStage: pl.Interview?.currentStage,
            finalStatus: pl.Interview?.finalStatus
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
      currentStage: 'candidate_entry',
      lastOperatorId: req.user.id
    });

    if (productLines && Array.isArray(productLines)) {
      for (const pl of productLines) {
        const newAssociation = await CandidateProductLine.create({
          candidateId: candidate.id,
          productLineId: pl.productLineId,
          interviewStage: 'recommend_interview'
        });

        await Interview.create({
          candidateProductLineId: newAssociation.id,
          currentStage: 'recommend_interview',
          finalStatus: 'pending'
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

    const { productLines, ...basicInfo } = req.body;

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

    await candidate.update(updateData);

    if (productLines && Array.isArray(productLines)) {
      const existingAssociations = await CandidateProductLine.findAll({
        where: { candidateId: candidate.id }
      });

      const existingIds = new Set(existingAssociations.map(assoc => assoc.id));
      const incomingIds = new Set(productLines.filter(pl => pl.id).map(pl => pl.id));

      for (const pl of productLines) {
        if (pl.id) {
          await CandidateProductLine.update({
            productLineId: pl.productLineId,
            recommendDate: pl.recommendDate,
            interviewStage: pl.interviewStage
          }, {
            where: { id: pl.id, candidateId: candidate.id }
          });

          if (pl.currentStage || pl.finalStatus) {
            await Interview.update({
              currentStage: pl.currentStage,
              finalStatus: pl.finalStatus
            }, {
              where: { candidateProductLineId: pl.id }
            });
          }

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
            currentStage: pl.currentStage || 'recommend_interview',
            finalStatus: pl.finalStatus || 'pending'
          });
        }
      }

      for (const id of existingIds) {
        await Interview.destroy({ where: { candidateProductLineId: id } });
        await CandidateProductLine.destroy({ where: { id } });
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
      if (currentIndex === -1 || currentIndex >= STAGES.length - 1) {
        return res.status(400).json({ error: 'Candidate already at final stage for this product line' });
      }

      const nextStage = STAGES[currentIndex + 1];
      await candidateProductLine.update({ interviewStage: nextStage });

      const interview = await Interview.findOne({
        where: { candidateProductLineId: candidateProductLine.id }
      });

      if (interview) {
        await interview.update({ currentStage: nextStage });
      }

      const candidate = await Candidate.findByPk(req.params.id);
      await candidate.update({ currentStage: nextStage, lastOperatorId: req.user.id });

      if (nextStage === 'pending_onboarding') {
        const passedProductLines = await CandidateProductLine.findAll({
          where: { candidateId: candidate.id },
          include: [{
            model: Interview,
            where: { finalStatus: 'passed' }
          }]
        });

        if (passedProductLines.length > 0) {
          for (const pl of passedProductLines) {
            await Employee.findOrCreate({
              where: {
                candidateId: candidate.id,
                productLineId: pl.productLineId
              },
              defaults: {
                name: candidate.name,
                email: candidate.email,
                phone: candidate.phone,
                gender: candidate.gender,
                idCard: candidate.idCard,
                currentStage: 'pending_onboarding',
                lastOperatorId: req.user.id
              }
            });
          }
        }
      }

      res.json({
        message: 'Candidate advanced to next stage',
        candidate
      });
    } else {
      const candidate = await Candidate.findByPk(req.params.id);
      if (!candidate) {
        return res.status(404).json({ error: 'Candidate not found' });
      }

      const currentIndex = STAGES.indexOf(candidate.currentStage || 'candidate_entry');
      if (currentIndex === -1 || currentIndex >= STAGES.length - 1) {
        return res.status(400).json({ error: 'Candidate already at final stage' });
      }

      const nextStage = STAGES[currentIndex + 1];
      await candidate.update({
        currentStage: nextStage,
        lastOperatorId: req.user.id
      });

      const candidateProductLines = await CandidateProductLine.findAll({
        where: { candidateId: candidate.id }
      });

      for (const cpl of candidateProductLines) {
        await cpl.update({ interviewStage: nextStage });
        
        const interview = await Interview.findOne({
          where: { candidateProductLineId: cpl.id }
        });
        if (interview) {
          await interview.update({ currentStage: nextStage });
        }
      }

      if (nextStage === 'pending_onboarding') {
        const passedProductLines = await CandidateProductLine.findAll({
          where: { candidateId: candidate.id },
          include: [{
            model: Interview,
            where: { finalStatus: 'passed' }
          }]
        });

        if (passedProductLines.length > 0) {
          for (const pl of passedProductLines) {
            await Employee.findOrCreate({
              where: {
                candidateId: candidate.id,
                productLineId: pl.productLineId
              },
              defaults: {
                name: candidate.name,
                email: candidate.email,
                phone: candidate.phone,
                gender: candidate.gender,
                idCard: candidate.idCard,
                currentStage: 'pending_onboarding',
                lastOperatorId: req.user.id
              }
            });
          }
        }
      }

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

      const interview = await Interview.findOne({
        where: { candidateProductLineId: candidateProductLine.id }
      });

      if (interview) {
        await interview.update({ currentStage: prevStage });
      }

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

      const currentIndex = STAGES.indexOf(candidate.currentStage || 'candidate_entry');
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

    const blockedStages = ['offer', 'pending_onboarding', 'entry', 'leave'];
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
      return assoc.Interview && assoc.Interview.finalStatus === 'passed';
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

    return res.json({ canRecommend: true, reason: '可以面推到其他产品线', availableProductLines });
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
      candidateProductLineId: newAssociation.id,
      currentStage: 'recommend_interview',
      finalStatus: 'pending'
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
