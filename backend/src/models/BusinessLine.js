const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BusinessLine = sequelize.define('BusinessLine', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  canEdit: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const value = this.getDataValue('canEdit');
      return value ? value.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) : [];
    },
    set(value) {
      if (Array.isArray(value)) {
        this.setDataValue('canEdit', value.filter(id => id).join(','));
      } else {
        this.setDataValue('canEdit', value);
      }
    }
  }
}, {
  tableName: 'business_line',
  timestamps: true,
  underscored: true
});

module.exports = BusinessLine;