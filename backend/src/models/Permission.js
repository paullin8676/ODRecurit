const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Permission = sequelize.define('Permission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('menu', 'button'),
    allowNull: false,
    defaultValue: 'menu'
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'permission',
      key: 'id'
    }
  },
  path: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  icon: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'permission',
  timestamps: true,
  underscored: true
});

module.exports = Permission;