const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CandidateStageTimeline = sequelize.define('CandidateStageTimeline', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  candidateId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'candidate_id'
  },
  stage: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  enteredAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'entered_at'
  },
  leftAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'left_at'
  },
  durationHours: {
    type: DataTypes.FLOAT,
    allowNull: true,
    field: 'duration_hours'
  },
  enteredBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'entered_by'
  },
  leftBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'left_by'
  }
}, {
  tableName: 'candidate_stage_timeline',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['candidate_id', 'stage']
    },
    {
      fields: ['stage']
    },
    {
      fields: ['entered_at']
    }
  ]
});

module.exports = CandidateStageTimeline;
