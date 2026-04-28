const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Candidate = sequelize.define('Candidate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
    defaultValue: 'employee_entry'
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
  leaveReason: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  leaveRemark: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

module.exports = Candidate;