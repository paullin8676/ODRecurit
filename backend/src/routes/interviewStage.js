const express = require('express');
const router = express.Router();
const InterviewStage = require('../models/InterviewStage');
const Candidate = require('../models/Candidate');
const ProductLine = require('../models/ProductLine');

// Get all interview stages for a candidate
router.get('/candidate/:candidateId', async (req, res) => {
  try {
    const { candidateId } = req.params;
    const interviewStages = await InterviewStage.findAll({
      where: { candidateId },
      include: [
        {
          model: ProductLine,
          as: 'productLine'
        }
      ]
    });
    res.json({ interviewStages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get interview stages by candidate and product line
router.get('/candidate/:candidateId/productLine/:productLineId', async (req, res) => {
  try {
    const { candidateId, productLineId } = req.params;
    const interviewStages = await InterviewStage.findAll({
      where: { candidateId, productLineId }
    });
    res.json({ interviewStages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single interview stage
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const interviewStage = await InterviewStage.findByPk(id);
    if (!interviewStage) {
      return res.status(404).json({ error: 'Interview stage not found' });
    }
    res.json({ interviewStage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new interview stage
router.post('/', async (req, res) => {
  try {
    const { candidateId, productLineId, interviewerId, stage, status, interviewDate, feedback, score } = req.body;
    
    // Validate candidate exists
    const candidate = await Candidate.findByPk(candidateId);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    // Validate product line exists
    const productLine = await ProductLine.findByPk(productLineId);
    if (!productLine) {
      return res.status(404).json({ error: 'Product line not found' });
    }
    
    const interviewStage = await InterviewStage.create({
      candidateId,
      productLineId,
      interviewerId,
      stage,
      status,
      interviewDate,
      feedback,
      score
    });
    
    res.status(201).json({ interviewStage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update an interview stage
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { interviewerId, stage, status, interviewDate, feedback, score } = req.body;
    
    const interviewStage = await InterviewStage.findByPk(id);
    if (!interviewStage) {
      return res.status(404).json({ error: 'Interview stage not found' });
    }
    
    await interviewStage.update({
      interviewerId,
      stage,
      status,
      interviewDate,
      feedback,
      score
    });
    
    res.json({ interviewStage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete an interview stage
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const interviewStage = await InterviewStage.findByPk(id);
    if (!interviewStage) {
      return res.status(404).json({ error: 'Interview stage not found' });
    }
    
    await interviewStage.destroy();
    res.json({ message: 'Interview stage deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;