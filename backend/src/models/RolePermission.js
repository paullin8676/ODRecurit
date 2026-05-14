const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RolePermission = sequelize.define('RolePermission', {
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'role',
      key: 'id'
    }
  },
  permissionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'permission',
      key: 'id'
    }
  }
}, {
  tableName: 'role_permission',
  timestamps: true,
  underscored: true,
  indexes: [
    { unique: true, fields: ['role_id', 'permission_id'] }
  ]
});

module.exports = RolePermission;