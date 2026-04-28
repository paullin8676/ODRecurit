const path = require('path');

require('dotenv').config();

const dbConfig = {
  dialect: process.env.DB_DIALECT || 'sqlite',
  storage: process.env.DB_PATH || path.join(__dirname, '../../database.sqlite'),
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
};

if (process.env.MYSQL_ENABLED === 'true') {
  dbConfig.host = process.env.DB_HOST || 'localhost';
  dbConfig.port = process.env.DB_PORT || 3306;
  dbConfig.username = process.env.DB_USER || 'root';
  dbConfig.password = process.env.DB_PASSWORD || '';
  dbConfig.name = process.env.DB_NAME || 'recruit_db';
}

module.exports = dbConfig;