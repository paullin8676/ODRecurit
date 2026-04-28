const { Sequelize } = require('sequelize');
const dbConfig = require('./dbConfig');

const sequelize = new Sequelize(dbConfig);

module.exports = sequelize;
