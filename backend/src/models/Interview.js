const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Interview = sequelize.define('Interview', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  candidateId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'candidate',
      key: 'id'
    }
  },
  businessLineId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'business_line',
      key: 'id'
    }
  },
  currentStatus: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'progressing'
  }
}, {
  tableName: 'interview',
  timestamps: true,
  underscored: true
});

module.exports = Interview;
