const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Candidate = require('./Candidate');
const ProductLine = require('./ProductLine');

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
});

// Define associations
Candidate.belongsToMany(ProductLine, {
  through: CandidateProductLine,
  as: 'productLines',
  foreignKey: 'candidateId',
  otherKey: 'productLineId'
});

ProductLine.belongsToMany(Candidate, {
  through: CandidateProductLine,
  as: 'candidates',
  foreignKey: 'productLineId',
  otherKey: 'candidateId'
});

// Additional associations for the join table
CandidateProductLine.belongsTo(Candidate, { foreignKey: 'candidateId' });
CandidateProductLine.belongsTo(ProductLine, { foreignKey: 'productLineId' });
CandidateProductLine.hasOne(require('./Interview'), { foreignKey: 'candidateProductLineId' });

// Add unique constraint to ensure only one record per candidate per product line
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