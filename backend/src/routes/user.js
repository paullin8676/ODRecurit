const express = require('express');
const bcrypt = require('bcryptjs');
const { User, Role, UserRole } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const PermissionService = require('../services/PermissionService');

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { isActive } = req.query;
    const where = {};

    if (isActive !== undefined) where.isActive = isActive === 'true';

    const userRoles = await PermissionService.getUserRoles(req.user.id);
    const hasAdminRole = userRoles.some(r => r.code === 'admin');
    
    if (!hasAdminRole) {
      const consultantIds = await PermissionService.getUserConsultantIds(req.user.id);
      where.id = consultantIds;
    }

    const users = await User.findAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      include: [{
        model: Role,
        through: UserRole,
        as: 'Roles'
      }]
    });

    const usersWithRoles = users.map(user => {
      const userJson = user.toJSON();
      delete userJson.Roles;
      return {
        ...userJson,
        roles: user.Roles ? user.Roles.map(r => ({
          id: r.id,
          name: r.name,
          code: r.code,
          level: r.level,
          dataScope: r.dataScope,
          description: r.description
        })) : []
      };
    });

    res.json({ users: usersWithRoles });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: User, as: 'manager', attributes: ['id', 'username', 'realName'] },
        { model: User, as: 'subordinates', attributes: ['id', 'username', 'realName'] },
        { model: Role, through: UserRole, as: 'Roles' }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const { username, password, role, realName, email, phone, managerId } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const userRoles = await PermissionService.getUserRoles(req.user.id);
    const hasManagerRole = userRoles.some(r => r.code === 'manager' || r.level >= 3);
    
    const user = await User.create({
      username,
      password: hashedPassword,
      realName,
      email,
      phone,
      managerId: managerId || (hasManagerRole ? req.user.id : req.user.managerId)
    });

    const roleCode = role || 'consultant';
    const roleRecord = await Role.findOne({ where: { code: roleCode } });
    if (roleRecord) {
      await user.addRole(roleRecord);
    }

    const roles = await PermissionService.getUserRoles(user.id);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        username: user.username,
        realName: user.realName,
        email: user.email,
        phone: user.phone,
        roles: roles.map(r => ({ id: r.id, name: r.name, code: r.code, level: r.level, dataScope: r.dataScope }))
      }
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userRoles = await PermissionService.getUserRoles(req.user.id);
    const hasAdminRole = userRoles.some(r => r.code === 'admin');
    const hasManagerRole = userRoles.some(r => r.level >= 2);
    
    if (!hasAdminRole && !hasManagerRole && req.user.id !== user.id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { realName, email, phone, managerId, isActive } = req.body;
    await user.update({
      realName: realName || user.realName,
      email: email || user.email,
      phone: phone || user.phone,
      managerId: managerId !== undefined ? managerId : user.managerId,
      isActive: isActive !== undefined ? isActive : user.isActive
    });

    const userJson = user.toJSON();
    const roles = await PermissionService.getUserRoles(user.id);

    res.json({
      message: 'User updated successfully',
      user: {
        ...userJson,
        roles,
        password: undefined
      }
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const roles = await PermissionService.getUserRoles(user.id);
    const hasAdminRole = roles.some(r => r.code === 'admin');
    
    if (hasAdminRole) {
      return res.status(400).json({ error: 'Cannot delete an admin user' });
    }

    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
