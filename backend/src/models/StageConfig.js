'use strict';
const { DataTypes } = require('sequelize');

const StageConfig = (sequelize) => {
  const StageConfig = sequelize.define('StageConfig', {
    module: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    stages: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    stageNames: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    }
  }, {
    tableName: 'StageConfig',
    timestamps: true
  });

  return StageConfig;
};

module.exports = StageConfig;