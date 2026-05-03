const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ExamPaper = sequelize.define('ExamPaper', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  totalScore: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'ExamPaper',
  timestamps: true,
  underscored: true
});

module.exports = ExamPaper;
