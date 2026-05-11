const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Exam = sequelize.define('Exam', {
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
    unique: true // 一个候选人只能有一条机考记录
  },
  examPaperId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'exam_paper',
      key: 'id'
    }
  },
  isOnlineExam: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  examDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  examCompleteDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  examTotalScore: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  isCheating: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  examScore: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  currentStatus: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'pending'
  }
}, {
  tableName: 'exam',
  timestamps: true,
  underscored: true
});

module.exports = Exam;