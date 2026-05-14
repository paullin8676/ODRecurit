const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  dataScope: {
    type: DataTypes.ENUM('self', 'subordinate', 'global'),
    allowNull: false,
    defaultValue: 'self'
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'role',
  timestamps: true,
  underscored: true
});

module.exports = Role;