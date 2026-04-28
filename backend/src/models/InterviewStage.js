const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Candidate = require('./Candidate');
const ProductLine = require('./ProductLine');

const InterviewStage = sequelize.define('InterviewStage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  candidateId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Candidate',
      key: 'id'
    }
  },
  productLineId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ProductLine',
      key: 'id'
    }
  },
  interviewerId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  stage: {
    type: DataTypes.STRING(20),
    allowNull: false // recommend, qualification, technical, manager
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pending' // pending, completed, passed, failed
  },
  interviewDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  score: {
    type: DataTypes.FLOAT,
    allowNull: true
  }
});

// Define associations
InterviewStage.belongsTo(Candidate, { foreignKey: 'candidateId' });

module.exports = InterviewStage;