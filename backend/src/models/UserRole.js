const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserRole = sequelize.define('UserRole', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'user_role',
  timestamps: true,
  underscored: true,
  indexes: [
    { unique: true, fields: ['user_id', 'role_id'] }
  ]
});

module.exports = UserRole;