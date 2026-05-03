const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InterviewRound = sequelize.define('InterviewRound', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  interviewId: {
    type: DataTypes.INTEGER,
    field: 'interview_id',
    allowNull: false,
    references: {
      model: 'Interview',
      key: 'id'
    }
  },
  stageCode: {
    type: DataTypes.STRING(50),
    field: 'stage_code',
    allowNull: false,
    comment: 'qualification_interview, tech_interview_1, tech_interview_2, manager_interview, approval, offer'
  },
  stageIndex: {
    type: DataTypes.INTEGER,
    field: 'stage_index',
    allowNull: false,
    comment: 'Stage order for sorting'
  },
  scheduledDate: {
    type: DataTypes.DATE,
    field: 'scheduled_date',
    allowNull: true
  },
  interviewer: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Interview evaluation/content'
  },
  passed: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    comment: 'Whether this round passed'
  },
  completedAt: {
    type: DataTypes.DATE,
    field: 'completed_at',
    allowNull: true,
    comment: 'When this round was completed'
  }
}, {
  tableName: 'InterviewRound',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['interview_id', 'stage_code']
    },
    {
      fields: ['interview_id']
    },
    {
      fields: ['stage_code']
    }
  ]
});

module.exports = InterviewRound;