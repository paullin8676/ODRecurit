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
    allowNull: false,
    unique: true,
    references: {
      model: 'CandidateProductLine',
      key: 'id'
    }
  },
  currentStage: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'recommend_interview'
  },
  finalStatus: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pending'
  }
}, {
  tableName: 'Interview',
  timestamps: true,
  underscored: true
});

module.exports = Interview;
