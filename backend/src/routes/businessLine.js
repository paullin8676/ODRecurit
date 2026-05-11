const express = require('express');
const { BusinessLine, Interview } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { isActive } = req.query;
    const where = {};

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const businessLines = await BusinessLine.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    res.json({ businessLines });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const businessLine = await BusinessLine.findByPk(req.params.id);

    if (!businessLine) {
      return res.status(404).json({ error: 'Business line not found' });
    }

    res.json({ businessLine });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, authorize('manager'), async (req, res, next) => {
  try {
    const { name, description, canEdit } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const businessLine = await BusinessLine.create({
      name,
      description,
      canEdit
    });

    res.status(201).json({
      message: 'Business line created successfully',
      businessLine
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Business line name already exists' });
    }
    next(error);
  }
});

router.put('/:id', authenticate, authorize('manager'), async (req, res, next) => {
  try {
    const businessLine = await BusinessLine.findByPk(req.params.id);

    if (!businessLine) {
      return res.status(404).json({ error: 'Business line not found' });
    }

    const { name, description, isActive, canEdit } = req.body;
    await businessLine.update({
      name: name || businessLine.name,
      description: description !== undefined ? description : businessLine.description,
      isActive: isActive !== undefined ? isActive : businessLine.isActive,
      canEdit: canEdit !== undefined ? canEdit : businessLine.canEdit
    });

    res.json({
      message: 'Business line updated successfully',
      businessLine
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, authorize('manager'), async (req, res, next) => {
  try {
    const businessLine = await BusinessLine.findByPk(req.params.id);

    if (!businessLine) {
      return res.status(404).json({ error: 'Business line not found' });
    }

    const candidateAssociations = await Interview.count({
      where: { businessLineId: req.params.id }
    });

    if (candidateAssociations > 0) {
      await businessLine.update({ isActive: false });
      res.json({ message: 'Business line deactivated successfully', deactivated: true });
    } else {
      await businessLine.destroy();
      res.json({ message: 'Business line deleted successfully', deleted: true });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;