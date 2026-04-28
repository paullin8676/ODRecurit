const express = require('express');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { role, isActive } = req.query;
    const where = {};

    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    if (req.user.role === 'consultant') {
      where.id = req.user.id;
    } else if (req.user.role === 'manager') {
      const subordinateIds = await getSubordinateIds(req.user.id);
      where.id = [...subordinateIds, req.user.id];
    }

    const users = await User.findAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    res.json({ users });
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
        { model: User, as: 'subordinates', attributes: ['id', 'username', 'realName'] }
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

router.post('/', authenticate, authorize('manager'), async (req, res, next) => {
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
    const user = await User.create({
      username,
      password: hashedPassword,
      role,
      realName,
      email,
      phone,
      managerId: managerId || (req.user.role === 'manager' ? req.user.id : req.user.managerId)
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        realName: user.realName,
        email: user.email,
        phone: user.phone
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

    if (req.user.role !== 'manager' && req.user.id !== user.id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { realName, email, phone, managerId } = req.body;
    await user.update({
      realName: realName || user.realName,
      email: email || user.email,
      phone: phone || user.phone,
      managerId: managerId !== undefined ? managerId : user.managerId
    });

    if (req.user.role === 'manager') {
      const { role, isActive } = req.body;
      if (role) await user.update({ role });
      if (isActive !== undefined) await user.update({ isActive });
    }

    res.json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        realName: user.realName,
        email: user.email,
        phone: user.phone,
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, authorize('manager'), async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'manager') {
      return res.status(400).json({ error: 'Cannot delete a manager' });
    }

    await user.update({ isActive: false });

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    next(error);
  }
});

async function getSubordinateIds(managerId) {
  const subordinates = await User.findAll({
    where: { managerId },
    attributes: ['id']
  });
  const ids = subordinates.map(s => s.id);
  for (const sub of subordinates) {
    const childIds = await getSubordinateIds(sub.id);
    ids.push(...childIds);
  }
  return ids;
}

module.exports = router;
