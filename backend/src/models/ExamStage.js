const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ExamStage = sequelize.define('ExamStage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  candidateId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  examPaperId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  score: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pending' // pending, completed, passed, failed
  },
  examDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

module.exports = ExamStage;