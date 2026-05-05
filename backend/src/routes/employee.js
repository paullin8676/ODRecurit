const express = require('express');
const { Employee, ProductLine, User, StageConfig, Candidate, CandidateProductLine, Interview } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, name, currentStage, stages } = req.query;

    let employeeStages = ['pending_onboarding', 'entry', 'leave'];
    // 优先使用前端传来的 stages 参数
    if (stages) {
      if (Array.isArray(stages)) {
        employeeStages = stages;
      } else if (typeof stages === 'string') {
        employeeStages = stages.split(',').map(s => s.trim()).filter(s => s);
      }
    } else {
      // 如果没有 stages 参数，才去查询数据库
      try {
        const stageConfig = await StageConfig.findOne({ where: { module: 'employee_management' } });
        if (stageConfig && stageConfig.config && stageConfig.config.stages && Array.isArray(stageConfig.config.stages)) {
          employeeStages = stageConfig.config.stages;
        }
      } catch (e) {
      }
    }

    const where = {
      currentStage: {
        [require('sequelize').Op.in]: employeeStages
      }
    };

    if (name) {
      where.name = { [require('sequelize').Op.like]: `%${name}%` };
    }

    if (currentStage) {
      where.currentStage = currentStage;
    }

    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;

    const { count, rows } = await Employee.findAndCountAll({
      where,
      include: [
        {
          model: ProductLine,
          as: 'productLine',
          attributes: ['id', 'name', 'clientOwner']
        },
        {
          model: User,
          as: 'lastOperator',
          attributes: ['id', 'username', 'realName']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      employees: rows,
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
          model: ProductLine,
          as: 'productLine',
          attributes: ['id', 'name', 'clientOwner']
        },
        {
          model: User,
          as: 'lastOperator',
          attributes: ['id', 'username', 'realName']
        }
      ]
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ employee });
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

    const { entryDate, entryRemark, leaveDate, leaveType, leaveRemark, ...basicInfo } = req.body;

    const updateData = {
      lastOperatorId: req.user.id
    };

    if (basicInfo.name) updateData.name = basicInfo.name;
    if (basicInfo.email) updateData.email = basicInfo.email;
    if (basicInfo.phone) updateData.phone = basicInfo.phone;
    if (basicInfo.gender) updateData.gender = basicInfo.gender;
    if (basicInfo.idCard) updateData.idCard = basicInfo.idCard;
    if (basicInfo.currentStage) updateData.currentStage = basicInfo.currentStage;

    if (entryDate !== undefined) updateData.entryDate = entryDate;
    if (entryRemark !== undefined) updateData.entryRemark = entryRemark;
    if (leaveDate !== undefined) updateData.leaveDate = leaveDate;
    if (leaveType !== undefined) updateData.leaveType = leaveType;
    if (leaveRemark !== undefined) updateData.leaveRemark = leaveRemark;

    if (!updateData.currentStage) {
      if (leaveDate && !employee.leaveDate) {
        updateData.currentStage = 'leave';
      } else if (!leaveDate && employee.leaveDate) {
        updateData.currentStage = 'entry';
      }
    }

    const previousStage = employee.currentStage;
    await employee.update(updateData);

    if (previousStage !== updateData.currentStage && (updateData.currentStage === 'entry' || updateData.currentStage === 'leave')) {
      if (employee.candidateId) {
        await Candidate.update(
          { currentStage: updateData.currentStage },
          { where: { id: employee.candidateId } }
        );
      }
    }

    await employee.reload({
      include: [
        {
          model: ProductLine,
          as: 'productLine',
          attributes: ['id', 'name', 'clientOwner']
        }
      ]
    });

    res.json({
      message: 'Employee updated successfully',
      employee
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

    const STAGES = ['pending_onboarding', 'entry', 'leave'];
    const currentIndex = STAGES.indexOf(employee.currentStage || 'pending_onboarding');
    if (currentIndex === -1 || currentIndex >= STAGES.length - 1) {
      return res.status(400).json({ error: 'Employee already at final stage' });
    }

    const nextStage = STAGES[currentIndex + 1];
    const updateData = {
      currentStage: nextStage,
      lastOperatorId: req.user.id
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

    const STAGES = ['pending_onboarding', 'entry', 'leave'];
    const currentIndex = STAGES.indexOf(employee.currentStage || 'pending_onboarding');
    if (currentIndex <= 0) {
      return res.status(400).json({ error: 'Employee already at first stage' });
    }

    const prevStage = STAGES[currentIndex - 1];
    await employee.update({
      currentStage: prevStage,
      lastOperatorId: req.user.id
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
