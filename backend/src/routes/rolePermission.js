const express = require('express');
const router = express.Router();
const { RolePermission, Permission } = require('../models');
const PermissionService = require('../services/PermissionService');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/role/:roleId', authenticate, async (req, res) => {
  try {
    const permissions = await PermissionService.getRolePermissions(req.params.roleId);
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/role/:roleId', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { permissionIds } = req.body;
    await PermissionService.assignPermissionsToRole(req.params.roleId, permissionIds);
    
    const permissions = await PermissionService.getRolePermissions(req.params.roleId);
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;