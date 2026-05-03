const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CandidateProductLine = sequelize.define('CandidateProductLine', {
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
    }
  },
  productLineId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ProductLine',
      key: 'id'
    }
  },
  recommendDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  interviewStage: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'recommend_interview'
  }
}, {
  tableName: 'CandidateProductLine',
  timestamps: true,
  underscored: true
});

CandidateProductLine.addHook('beforeCreate', async (candidateProductLine) => {
  const existingRecord = await CandidateProductLine.findOne({
    where: {
      candidateId: candidateProductLine.candidateId,
      productLineId: candidateProductLine.productLineId
    }
  });
  
  if (existingRecord) {
    throw new Error('Candidate already has a record for this product line');
  }
});

module.exports = CandidateProductLine;