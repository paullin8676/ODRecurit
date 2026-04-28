const express = require('express');
const { ExamPaper } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { isActive } = req.query;
    const where = {};

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const examPapers = await ExamPaper.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    res.json({ examPapers });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const examPaper = await ExamPaper.findByPk(req.params.id);

    if (!examPaper) {
      return res.status(404).json({ error: 'Exam paper not found' });
    }

    res.json({ examPaper });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, authorize('manager'), async (req, res, next) => {
  try {
    const { name, description, totalScore } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const examPaper = await ExamPaper.create({
      name,
      description,
      totalScore
    });

    res.status(201).json({
      message: 'Exam paper created successfully',
      examPaper
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Exam paper name already exists' });
    }
    next(error);
  }
});

router.put('/:id', authenticate, authorize('manager'), async (req, res, next) => {
  try {
    const examPaper = await ExamPaper.findByPk(req.params.id);

    if (!examPaper) {
      return res.status(404).json({ error: 'Exam paper not found' });
    }

    const { name, description, totalScore, isActive } = req.body;
    await examPaper.update({
      name: name || examPaper.name,
      description: description !== undefined ? description : examPaper.description,
      totalScore: totalScore !== undefined ? totalScore : examPaper.totalScore,
      isActive: isActive !== undefined ? isActive : examPaper.isActive
    });

    res.json({
      message: 'Exam paper updated successfully',
      examPaper
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, authorize('manager'), async (req, res, next) => {
  try {
    const examPaper = await ExamPaper.findByPk(req.params.id);

    if (!examPaper) {
      return res.status(404).json({ error: 'Exam paper not found' });
    }

    // Check if exam paper is associated with any exams
    const { Exam } = require('../models');
    const examAssociations = await Exam.count({
      where: { examPaperId: req.params.id }
    });

    if (examAssociations > 0) {
      // If associated with exams, deactivate
      await examPaper.update({ isActive: false });
      res.json({ message: 'Exam paper deactivated successfully', deactivated: true });
    } else {
      // If no associations, delete permanently
      await examPaper.destroy();
      res.json({ message: 'Exam paper deleted successfully', deleted: true });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
