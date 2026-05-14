const express = require('express');
const router = express.Router();
const { UserRole, User, Role } = require('../models');
const PermissionService = require('../services/PermissionService');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/user/:userId', authenticate, async (req, res) => {
  try {
    const userRoles = await UserRole.findAll({
      where: { userId: req.params.userId },
      include: [Role]
    });
    res.json(userRoles.map(ur => ur.Role));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/role/:roleId', authenticate, async (req, res) => {
  try {
    const roleUsers = await UserRole.findAll({
      where: { roleId: req.params.roleId },
      include: [User]
    });
    res.json(roleUsers.map(ur => ur.User));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/user/:userId', authenticate, async (req, res) => {
  try {
    const userRoles = await PermissionService.getUserRoles(req.user.id);
    const hasAdminRole = userRoles.some(r => r.code === 'admin');
    const hasManagerRole = userRoles.some(r => r.level >= 2);
    
    if (!hasAdminRole && !hasManagerRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { roleIds } = req.body;
    await PermissionService.assignRolesToUser(req.params.userId, roleIds);
    
    const updatedRoles = await PermissionService.getUserRoles(req.params.userId);
    res.json(updatedRoles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;