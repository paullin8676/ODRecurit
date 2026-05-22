const express = require('express');
const { authenticate } = require('../middleware/auth');
const BackupService = require('../services/BackupService');

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const result = await BackupService.listBackups(page, pageSize);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/config', authenticate, async (req, res, next) => {
  try {
    res.json(BackupService.getScheduleConfig());
  } catch (error) {
    next(error);
  }
});

router.put('/config', authenticate, async (req, res, next) => {
  try {
    const { scheduleTime } = req.body;
    const config = await BackupService.updateScheduleTime(scheduleTime);
    res.json(config);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/create', authenticate, async (req, res, next) => {
  try {
    const result = await BackupService.createBackup('manual');
    if (result.success) {
      res.json({ backup: result.record });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const result = await BackupService.deleteBackup(req.params.id);
    if (result.success) {
      res.json({ message: 'Backup deleted' });
    } else {
      res.status(404).json({ error: result.error });
    }
  } catch (error) {
    next(error);
  }
});

router.post('/:id/restore', authenticate, async (req, res, next) => {
  try {
    const result = await BackupService.restoreBackup(req.params.id);
    if (result.success) {
      res.json({ message: 'Database restored successfully' });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
