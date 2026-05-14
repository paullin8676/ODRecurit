const jwt = require('jsonwebtoken');
const { User } = require('../models');
const PermissionService = require('../services/PermissionService');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    const roles = await PermissionService.getUserRoles(user.id);
    const permissions = await PermissionService.getUserPermissions(user.id);
    const dataScope = await PermissionService.getUserRoleDataScope(user.id);
    const subordinateIds = await PermissionService.getUserSubordinates(user.id, false);

    req.user = {
      ...user.toJSON(),
      roles: roles.map(r => ({ id: r.id, name: r.name, code: r.code, level: r.level, dataScope: r.dataScope })),
      permissions: permissions.map(p => ({ id: p.id, code: p.code, name: p.name, type: p.type })),
      dataScope,
      subordinateIds
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    next(error);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    const userRoleCodes = req.user.roles.map(r => r.code);
    const hasRole = roles.some(role => userRoleCodes.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

const requirePermission = (permissionCode) => {
  return async (req, res, next) => {
    const hasPermission = await PermissionService.hasPermission(req.user.id, permissionCode);
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

module.exports = { authenticate, authorize, requirePermission, JWT_SECRET };