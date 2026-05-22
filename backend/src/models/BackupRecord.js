'use strict';
const { DataTypes } = require('sequelize');

const BackupRecord = (sequelize) => {
  const BackupRecord = sequelize.define('BackupRecord', {
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    filePath: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    backupType: {
      type: DataTypes.ENUM('scheduled', 'manual'),
      allowNull: false,
      defaultValue: 'manual'
    },
    status: {
      type: DataTypes.ENUM('completed', 'failed', 'in_progress'),
      allowNull: false,
      defaultValue: 'completed'
    },
    scheduleTime: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'backup_records',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return BackupRecord;
};

module.exports = BackupRecord;
