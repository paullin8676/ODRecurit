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
    defaultValue: 'candidate_entry'
  }
}, {
  tableName: 'Candidate',
  timestamps: true,
  underscored: true
});

module.exports = Candidate;