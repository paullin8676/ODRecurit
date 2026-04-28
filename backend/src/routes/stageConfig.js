const express = require('express');
const { StageConfig } = require('../models');

const router = express.Router();

const VALID_MODULES = [
  'candidate_entry',
  'exam_management',
  'test_management',
  'interview_management',
  'employee_management'
];

router.get('/', async (req, res) => {
  try {
    const configs = await StageConfig.findAll();
    res.json({ configs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:module', async (req, res) => {
  try {
    const { module } = req.params;

    if (!VALID_MODULES.includes(module)) {
      return res.status(400).json({ error: 'Invalid module name' });
    }

    const config = await StageConfig.findOne({ where: { module } });
    if (!config) {
      return res.status(404).json({ error: 'Stage config not found' });
    }
    res.json({ config });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { module, config } = req.body;

    if (!module) {
      return res.status(400).json({ error: 'Module is required' });
    }

    if (!VALID_MODULES.includes(module)) {
      return res.status(400).json({ error: 'Invalid module name' });
    }

    const existingConfig = await StageConfig.findOne({ where: { module } });
    if (existingConfig) {
      return res.status(400).json({ error: 'Stage config already exists for this module' });
    }

    const newConfig = await StageConfig.create({ module, stages: config.stages });
    res.status(201).json({ config: newConfig });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:module', async (req, res) => {
  try {
    const { module } = req.params;
    const { stages } = req.body;

    if (!VALID_MODULES.includes(module)) {
      return res.status(400).json({ error: 'Invalid module name' });
    }

    const stageConfig = await StageConfig.findOne({ where: { module } });
    if (!stageConfig) {
      return res.status(404).json({ error: 'Stage config not found' });
    }

    await stageConfig.update({ stages });
    res.json({ config: stageConfig });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:module', async (req, res) => {
  try {
    const { module } = req.params;

    if (!VALID_MODULES.includes(module)) {
      return res.status(400).json({ error: 'Invalid module name' });
    }

    const stageConfig = await StageConfig.findOne({ where: { module } });
    if (!stageConfig) {
      return res.status(404).json({ error: 'Stage config not found' });
    }

    await stageConfig.destroy();
    res.json({ message: 'Stage config deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;