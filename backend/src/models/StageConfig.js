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
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '[]',
      get() {
        const value = this.getDataValue('stages');
        if (Array.isArray(value)) {
          return value;
        }
        try {
          return JSON.parse(value);
        } catch {
          return [];
        }
      },
      set(value) {
        if (Array.isArray(value)) {
          this.setDataValue('stages', JSON.stringify(value));
        } else {
          this.setDataValue('stages', value);
        }
      }
    },
    stageNames: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '{}',
      get() {
        const value = this.getDataValue('stageNames');
        if (typeof value === 'object' && !Array.isArray(value)) {
          return value;
        }
        try {
          return JSON.parse(value);
        } catch {
          return {};
        }
      },
      set(value) {
        if (typeof value === 'object' && !Array.isArray(value)) {
          this.setDataValue('stageNames', JSON.stringify(value));
        } else {
          this.setDataValue('stageNames', value);
        }
      }
    }
  }, {
    tableName: 'stage_config',
    timestamps: true
  });

  return StageConfig;
};

module.exports = StageConfig;