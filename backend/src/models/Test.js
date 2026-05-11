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
      model: 'candidate',
      key: 'id'
    },
    unique: true // 一个候选人只能有一条韧测记录
  },
  issueDate: {
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
  emotionScore: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  currentStatus: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'abandoned', 'passed', 'failed']]
    }
  }
}, {
  tableName: 'test',
  timestamps: true,
  underscored: true
});

module.exports = Test;