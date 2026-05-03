const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Employee = sequelize.define('Employee', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  candidateId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Candidate',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  gender: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  idCard: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  lastOperatorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'User',
      key: 'id'
    }
  },
  currentStage: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'pending_onboarding'
  },
  entryDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  entryRemark: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  leaveDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  leaveType: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '主动离职(1) 或 被动离职(2)'
  },
  leaveRemark: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  productLineId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'ProductLine',
      key: 'id'
    }
  }
}, {
  tableName: 'Employee',
  timestamps: true,
  underscored: true
});

module.exports = Employee;
