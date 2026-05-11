const express = require('express');
const { Employee, BusinessLine, User, StageConfig, Candidate } = require('../models');
const { authenticate } = require('../middleware/auth');
const StageService = require('../services/stageService');

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, name, stages } = req.query;

    let employeeStages = ['pending_onboarding', 'entry', 'leave'];
    if (stages) {
      if (Array.isArray(stages)) {
        employeeStages = stages;
      } else if (typeof stages === 'string') {
        employeeStages = stages.split(',').map(s => s.trim()).filter(s => s);
      }
    } else {
      try {
        const stageConfig = await StageConfig.findOne({ where: { module: 'employee_management' } });
        if (stageConfig && stageConfig.config && stageConfig.config.stages && Array.isArray(stageConfig.config.stages)) {
          employeeStages = stageConfig.config.stages;
        }
      } catch (e) {
      }
    }

    const { Op } = require('sequelize');
    const where = {};

    if (name) {
      const candidates = await Candidate.findAll({
        where: { name: { [Op.like]: `%${name}%` } },
        attributes: ['id']
      });
      const candidateIds = candidates.map(c => c.id);
      where.candidateId = { [Op.in]: candidateIds.length > 0 ? candidateIds : [0] };
    }

    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;

    const { count, rows } = await Employee.findAndCountAll({
      where,
      include: [
        {
          model: BusinessLine,
          as: 'businessLine',
          attributes: ['id', 'name']
        },
        {
          model: Candidate,
          attributes: ['id', 'name', 'email', 'phone', 'gender', 'idCard']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const employeesWithCandidate = await Promise.all(rows.map(async (employee) => {
      const candidate = employee.Candidate;
      const candidateStage = candidate ? await StageService.getStage(candidate.id) : null;
      
      return {
        id: employee.id,
        candidateId: employee.candidateId,
        businessLineId: employee.businessLineId,
        businessLine: employee.businessLine,
        name: candidate ? candidate.name : null,
        email: candidate ? candidate.email : null,
        phone: candidate ? candidate.phone : null,
        gender: candidate ? candidate.gender : null,
        idCard: candidate ? candidate.idCard : null,
        currentStage: candidateStage ? candidateStage.currentStage : null,
        entryDate: employee.entryDate,
        entryRemark: employee.entryRemark,
        leaveDate: employee.leaveDate,
        leaveType: employee.leaveType,
        leaveRemark: employee.leaveRemark,
        createdAt: employee.createdAt,
        updatedAt: employee.updatedAt
      };
    }));

    res.json({
      employees: employeesWithCandidate,
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
    const employee = await Employee.findByPk(req.params.id, {
      include: [
        {
          model: BusinessLine,
          as: 'businessLine',
          attributes: ['id', 'name']
        },
        {
          model: Candidate,
          attributes: ['id', 'name', 'email', 'phone', 'gender', 'idCard']
        }
      ]
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const candidate = employee.Candidate;
    const candidateStage = candidate ? await StageService.getStage(candidate.id) : null;

    const result = {
      id: employee.id,
      candidateId: employee.candidateId,
      businessLineId: employee.businessLineId,
      businessLine: employee.businessLine,
      name: candidate ? candidate.name : null,
      email: candidate ? candidate.email : null,
      phone: candidate ? candidate.phone : null,
      gender: candidate ? candidate.gender : null,
      idCard: candidate ? candidate.idCard : null,
      currentStage: candidateStage ? candidateStage.currentStage : null,
      entryDate: employee.entryDate,
      entryRemark: employee.entryRemark,
      leaveDate: employee.leaveDate,
      leaveType: employee.leaveType,
      leaveRemark: employee.leaveRemark,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt
    };

    res.json({ employee: result });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const employee = await Employee.findByPk(req.params.id);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const { entryDate, entryRemark, leaveDate, leaveType, leaveRemark, currentStage } = req.body;

    const updateData = {
      updatedBy: req.user.id
    };

    if (entryDate !== undefined && entryDate !== null) updateData.entryDate = entryDate;
    if (entryRemark !== undefined && entryRemark !== null) updateData.entryRemark = entryRemark;
    if (leaveDate !== undefined && leaveDate !== null) updateData.leaveDate = leaveDate;
    if (leaveType !== undefined && leaveType !== null) updateData.leaveType = leaveType;
    if (leaveRemark !== undefined && leaveRemark !== null) updateData.leaveRemark = leaveRemark;

    if (currentStage) {
      if (employee.candidateId) {
        await StageService.updateStage(employee.candidateId, currentStage, req.user.id);
      }
    } else {
      if (leaveDate && !employee.leaveDate) {
        const targetStage = 'leave';
        if (employee.candidateId) {
          await StageService.updateStage(employee.candidateId, targetStage, req.user.id);
        }
      } else if (!leaveDate && employee.leaveDate) {
        const targetStage = 'entry';
        if (employee.candidateId) {
          await StageService.updateStage(employee.candidateId, targetStage, req.user.id);
        }
      }
    }

    await employee.update(updateData);

    await employee.reload({
      include: [
        {
          model: BusinessLine,
          as: 'businessLine',
          attributes: ['id', 'name']
        },
        {
          model: Candidate,
          attributes: ['id', 'name', 'email', 'phone', 'gender', 'idCard']
        }
      ]
    });

    const candidate = employee.Candidate;
    const candidateStage = candidate ? await StageService.getStage(candidate.id) : null;

    const result = {
      id: employee.id,
      candidateId: employee.candidateId,
      businessLineId: employee.businessLineId,
      businessLine: employee.businessLine,
      name: candidate ? candidate.name : null,
      email: candidate ? candidate.email : null,
      phone: candidate ? candidate.phone : null,
      gender: candidate ? candidate.gender : null,
      idCard: candidate ? candidate.idCard : null,
      currentStage: candidateStage ? candidateStage.currentStage : null,
      entryDate: employee.entryDate,
      entryRemark: employee.entryRemark,
      leaveDate: employee.leaveDate,
      leaveType: employee.leaveType,
      leaveRemark: employee.leaveRemark,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt
    };

    res.json({
      message: 'Employee updated successfully',
      employee: result
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/advance', authenticate, async (req, res, next) => {
  try {
    const { entryDate, entryRemark } = req.body;

    const employee = await Employee.findByPk(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const candidateStage = employee.candidateId ? await StageService.getStage(employee.candidateId) : null;
    const currentStage = candidateStage ? candidateStage.currentStage : 'pending_onboarding';
    
    const STAGES = ['pending_onboarding', 'entry', 'leave'];
    const currentIndex = STAGES.indexOf(currentStage);
    if (currentIndex === -1 || currentIndex >= STAGES.length - 1) {
      return res.status(400).json({ error: 'Employee already at final stage' });
    }

    const nextStage = STAGES[currentIndex + 1];

    if (employee.candidateId) {
      await StageService.updateStage(employee.candidateId, nextStage, req.user.id);
    }

    const updateData = {
      updatedBy: req.user.id
    };

    if (nextStage === 'entry') {
      if (entryDate) updateData.entryDate = entryDate;
      if (entryRemark) updateData.entryRemark = entryRemark;
    }

    await employee.update(updateData);

    res.json({
      message: 'Employee advanced to next stage',
      employee
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/rollback', authenticate, async (req, res, next) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const candidateStage = employee.candidateId ? await StageService.getStage(employee.candidateId) : null;
    const currentStage = candidateStage ? candidateStage.currentStage : 'pending_onboarding';
    
    const STAGES = ['pending_onboarding', 'entry', 'leave'];
    const currentIndex = STAGES.indexOf(currentStage);
    if (currentIndex <= 0) {
      return res.status(400).json({ error: 'Employee already at first stage' });
    }

    const prevStage = STAGES[currentIndex - 1];

    if (employee.candidateId) {
      await StageService.updateStage(employee.candidateId, prevStage, req.user.id);
    }

    await employee.update({
      updatedBy: req.user.id
    });

    res.json({
      message: 'Employee rolled back to previous stage',
      employee
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const employee = await Employee.findByPk(req.params.id);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    await employee.destroy();

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;