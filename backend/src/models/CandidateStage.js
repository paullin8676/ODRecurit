const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CandidateStage = sequelize.define('CandidateStage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  candidateId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'candidate',
      key: 'id'
    }
  },
  consultantId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'user',
      key: 'id'
    }
  },
  currentStage: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'candidate_entry'
  },
  previousStage: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  stageHistory: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '[]'
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'user',
      key: 'id'
    }
  }
}, {
  tableName: 'candidate_stage',
  timestamps: true,
  underscored: true
});

module.exports = CandidateStage;