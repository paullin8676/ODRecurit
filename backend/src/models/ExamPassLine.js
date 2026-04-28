const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ExamPassLine = sequelize.define('ExamPassLine', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  examPaperId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ExamPaper',
      key: 'id'
    }
  },
  passLine: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  isCurrent: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

module.exports = ExamPassLine;
