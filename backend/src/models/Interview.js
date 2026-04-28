const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Interview = sequelize.define('Interview', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  candidateProductLineId: {
    type: DataTypes.INTEGER,
    field: 'candidateProductLineId',
    allowNull: false,
    unique: true,
    references: {
      model: 'CandidateProductLine',
      key: 'id'
    }
  },
  qualificationInterviewDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  qualificationInterviewer: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  qualificationConclusion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  qualificationPassed: {
    type: DataTypes.BOOLEAN,
    allowNull: true
  },
  techInterview1Date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  techInterview1Interviewer: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  techInterview1Content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  techInterview1Passed: {
    type: DataTypes.BOOLEAN,
    allowNull: true
  },
  techInterview2Date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  techInterview2Interviewer: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  techInterview2Content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  techInterview2Passed: {
    type: DataTypes.BOOLEAN,
    allowNull: true
  },
  managerInterviewDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  managerInterviewer: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  managerInterviewContent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  managerInterviewPassed: {
    type: DataTypes.BOOLEAN,
    allowNull: true
  },
  approvalDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  approver: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  approvalRemark: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  approvalPassed: {
    type: DataTypes.BOOLEAN,
    allowNull: true
  },
  offerDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  offerApprover: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  offerRemark: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

// Define associations
// We'll define the association in CandidateProductLine.js to avoid circular references

module.exports = Interview;