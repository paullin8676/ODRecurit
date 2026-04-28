const express = require('express');
const { ExamPassLine, ExamPaper } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { examPaperId, isCurrent } = req.query;
    const where = {};

    if (examPaperId) where.examPaperId = examPaperId;
    if (isCurrent !== undefined) where.isCurrent = isCurrent === 'true';

    const examPassLines = await ExamPassLine.findAll({
      where,
      include: [
        { model: ExamPaper, attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ examPassLines });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const examPassLine = await ExamPassLine.findByPk(req.params.id, {
      include: [
        { model: ExamPaper, attributes: ['id', 'name'] }
      ]
    });

    if (!examPassLine) {
      return res.status(404).json({ error: 'Exam pass line not found' });
    }

    res.json({ examPassLine });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, authorize('manager'), async (req, res, next) => {
  try {
    const { examPaperId, passLine } = req.body;

    if (!examPaperId || passLine === undefined) {
      return res.status(400).json({ error: 'Exam paper ID and pass line are required' });
    }

    const examPaper = await ExamPaper.findByPk(examPaperId);
    if (!examPaper) {
      return res.status(400).json({ error: 'Exam paper not found' });
    }

    await ExamPassLine.update(
      { isCurrent: false },
      { where: { examPaperId, isCurrent: true } }
    );

    const examPassLine = await ExamPassLine.create({
      examPaperId,
      passLine,
      isCurrent: true
    });

    res.status(201).json({
      message: 'Exam pass line created successfully',
      examPassLine
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, authorize('manager'), async (req, res, next) => {
  try {
    const examPassLine = await ExamPassLine.findByPk(req.params.id);

    if (!examPassLine) {
      return res.status(404).json({ error: 'Exam pass line not found' });
    }

    const { passLine, isCurrent } = req.body;

  if (isCurrent) {
    await ExamPassLine.update(
      { isCurrent: false },
      { where: { examPaperId: examPassLine.examPaperId, isCurrent: true } }
    );
  }

  await examPassLine.update({
    passLine: passLine !== undefined ? passLine : examPassLine.passLine,
    isCurrent: isCurrent !== undefined ? isCurrent : examPassLine.isCurrent
  });

    res.json({
      message: 'Exam pass line updated successfully',
      examPassLine
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, authorize('manager'), async (req, res, next) => {
  try {
    const examPassLine = await ExamPassLine.findByPk(req.params.id);

    if (!examPassLine) {
      return res.status(404).json({ error: 'Exam pass line not found' });
    }

    await examPassLine.destroy();

    res.json({ message: 'Exam pass line deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
