const express = require('express');
const router = express.Router();
const { Permission } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const permissions = await Permission.findAll();
    const permMap = {};
    permissions.forEach(p => permMap[p.id] = p);
    
    const getFullSortOrder = (p) => {
      if (!p.parentId) return `${String(p.sortOrder).padStart(4, '0')}`;
      const parent = permMap[p.parentId];
      if (parent) return `${getFullSortOrder(parent)}-${String(p.sortOrder).padStart(4, '0')}`;
      return `${String(p.sortOrder).padStart(4, '0')}`;
    };
    
    const sorted = [...permissions].sort((a, b) => {
      const orderA = getFullSortOrder(a);
      const orderB = getFullSortOrder(b);
      return orderA.localeCompare(orderB);
    });
    
    const filtered = sorted.filter(p => {
      if (p.type === 'button') return true;
      if (p.type === 'menu' && (!p.path || p.path.trim() === '')) return false;
      return true;
    });
    
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const permission = await Permission.findByPk(req.params.id);
    if (!permission) {
      return res.status(404).json({ error: 'Permission not found' });
    }
    res.json(permission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const permission = await Permission.create(req.body);
    res.status(201).json(permission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const permission = await Permission.findByPk(req.params.id);
    if (!permission) {
      return res.status(404).json({ error: 'Permission not found' });
    }
    await permission.update(req.body);
    res.json(permission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const permission = await Permission.findByPk(req.params.id);
    if (!permission) {
      return res.status(404).json({ error: 'Permission not found' });
    }
    await permission.destroy();
    res.json({ message: 'Permission deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;