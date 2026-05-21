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
      name: 'idx_cst_stage',
      fields: ['stage']
    },
    {
      name: 'idx_cst_entered',
      fields: ['entered_at']
    },
    {
      name: 'idx_cst_stage_entered',
      fields: ['stage', 'entered_at']
    },
    {
      name: 'idx_cst_stage_dur',
      fields: ['stage', 'duration_hours']
    },
    {
      name: 'idx_cst_cov1',
      fields: ['entered_at', 'left_at', 'duration_hours', 'stage']
    },
    {
      name: 'idx_cst_cov2',
      fields: ['candidate_id', 'stage', 'entered_at', 'left_at', 'duration_hours']
    }
  ]
});

module.exports = CandidateStageTimeline;
