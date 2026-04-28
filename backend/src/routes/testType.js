const express = require('express');
const { TestType } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { isActive } = req.query;
    const where = {};

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const testTypes = await TestType.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    res.json({ testTypes });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const testType = await TestType.findByPk(req.params.id);

    if (!testType) {
      return res.status(404).json({ error: 'Test type not found' });
    }

    res.json({ testType });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, authorize('manager'), async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const testType = await TestType.create({
      name,
      description
    });

    res.status(201).json({
      message: 'Test type created successfully',
      testType
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Test type name already exists' });
    }
    next(error);
  }
});

router.put('/:id', authenticate, authorize('manager'), async (req, res, next) => {
  try {
    const testType = await TestType.findByPk(req.params.id);

    if (!testType) {
      return res.status(404).json({ error: 'Test type not found' });
    }

    const { name, description, isActive } = req.body;
    await testType.update({
      name: name || testType.name,
      description: description !== undefined ? description : testType.description,
      isActive: isActive !== undefined ? isActive : testType.isActive
    });

    res.json({
      message: 'Test type updated successfully',
      testType
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, authorize('manager'), async (req, res, next) => {
  try {
    const testType = await TestType.findByPk(req.params.id);

    if (!testType) {
      return res.status(404).json({ error: 'Test type not found' });
    }

    // Check if test type is associated with any tests
    const { Test } = require('../models');
    const testAssociations = await Test.count({
      where: { testTypeId: req.params.id }
    });

    if (testAssociations > 0) {
      // If associated with tests, deactivate
      await testType.update({ isActive: false });
      res.json({ message: 'Test type deactivated successfully', deactivated: true });
    } else {
      // If no associations, delete permanently
      await testType.destroy();
      res.json({ message: 'Test type deleted successfully', deleted: true });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
