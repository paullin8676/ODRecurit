const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Role, UserRole } = require('../models');
const { authenticate, JWT_SECRET } = require('../middleware/auth');
const PermissionService = require('../services/PermissionService');

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const { username, password, role, realName, email, phone } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password: hashedPassword,
      realName,
      email,
      phone
    });

    const roleCode = role || 'consultant';
    const roleRecord = await Role.findOne({ where: { code: roleCode } });
    if (roleRecord) {
      await user.addRole(roleRecord);
    }

    const roles = await PermissionService.getUserRoles(user.id);
    const permissions = await PermissionService.getUserPermissions(user.id);
    const dataScope = await PermissionService.getUserRoleDataScope(user.id);
    const subordinateIds = await PermissionService.getUserSubordinates(user.id, false);

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        realName: user.realName,
        email: user.email,
        phone: user.phone,
        roles: roles.map(r => ({ id: r.id, name: r.name, code: r.code, level: r.level, dataScope: r.dataScope })),
        permissions: permissions.map(p => ({ id: p.id, code: p.code, name: p.name, type: p.type })),
        dataScope,
        subordinateIds
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await user.update({ lastLoginAt: new Date() });

    const roles = await PermissionService.getUserRoles(user.id);
    const permissions = await PermissionService.getUserPermissions(user.id);
    const dataScope = await PermissionService.getUserRoleDataScope(user.id);
    const subordinateIds = await PermissionService.getUserSubordinates(user.id, false);

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        realName: user.realName,
        email: user.email,
        phone: user.phone,
        roles: roles.map(r => ({ id: r.id, name: r.name, code: r.code, level: r.level, dataScope: r.dataScope })),
        permissions: permissions.map(p => ({ id: p.id, code: p.code, name: p.name, type: p.type })),
        dataScope,
        subordinateIds
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

router.post('/change-password', authenticate, async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old and new password are required' });
    }

    const userWithPassword = await User.findByPk(req.user.id, {
      attributes: ['password']
    });

    const isValidPassword = await bcrypt.compare(oldPassword, userWithPassword.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Old password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.update({ password: hashedPassword }, { where: { id: req.user.id } });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
