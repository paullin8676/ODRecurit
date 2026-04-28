const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Test = sequelize.define('Test', {
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
    },
    unique: true // 一个候选人只能有一条韧测记录
  },
  testTypeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'TestType',
      key: 'id'
    }
  },
  testDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  testCompleteDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  worryValue: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  optimismValue: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  consistency: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  testPassed: {
    type: DataTypes.BOOLEAN,
    allowNull: true
  }
});

module.exports = Test;