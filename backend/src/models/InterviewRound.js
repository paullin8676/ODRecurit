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
      model: 'interview',
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
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Interview evaluation/content'
  },
  currentStatus: {
    type: DataTypes.STRING(50),
    field: 'current_status',
    allowNull: true,
    comment: 'Current status of this round: pending_filter/passed/failed for recommend_interview; passed/failed for others'
  },
  feedbackDate: {
    type: DataTypes.DATE,
    field: 'feedback_date',
    allowNull: true,
    comment: 'Feedback date for this round'
  },
  completedAt: {
    type: DataTypes.DATE,
    field: 'completed_at',
    allowNull: true,
    comment: 'When this round was completed'
  },
  entryDate: {
    type: DataTypes.DATE,
    field: 'entry_date',
    allowNull: true,
    comment: 'Entry date for offer stage'
  }
}, {
  tableName: 'interview_round',
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