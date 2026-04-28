const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const ProductLine = sequelize.define('ProductLine', {
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
  clientOwner: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

// Create many-to-many association with User
const ProductLineUser = sequelize.define('ProductLineUser', {
  productLineId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'ProductLine',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'User',
      key: 'id'
    }
  }
});

ProductLine.belongsToMany(User, {
  through: ProductLineUser,
  as: 'consultants',
  foreignKey: 'productLineId',
  otherKey: 'userId'
});

User.belongsToMany(ProductLine, {
  through: ProductLineUser,
  as: 'productLines',
  foreignKey: 'userId',
  otherKey: 'productLineId'
});

module.exports = ProductLine;
