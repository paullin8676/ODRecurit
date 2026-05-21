const path = require('path');

require('dotenv').config();

const isSQLite = (process.env.DB_DIALECT === 'sqlite');
const isMariaDB = (process.env.DB_DIALECT === 'mariadb' || process.env.DB_DIALECT === 'mysql');
const mySQLEnabled = (process.env.MYSQL_ENABLED === 'true') || isMariaDB;

const dbConfig = {
  dialect: process.env.DB_DIALECT || 'sqlite',
  storage: process.env.DB_PATH || path.join(__dirname, '../../database.sqlite'),
  logging: process.env.NODE_ENV === 'development' ? console.log : false,

  pool: mySQLEnabled ? {
    max: 25,
    min: 5,
    acquire: 60000,
    idle: 30000
  } : {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  },
  dialectOptions: {
    sqlite: {
      maxConcurrentStatements: 100,
      timeout: 5000
    }
  }
};

if (mySQLEnabled) {
  dbConfig.host = process.env.DB_HOST || 'localhost';
  dbConfig.port = parseInt(process.env.DB_PORT) || 3306;
  dbConfig.username = process.env.DB_USER || 'root';
  dbConfig.password = process.env.DB_PASSWORD || '';
  dbConfig.database = process.env.DB_NAME || 'recruit_db';
  dbConfig.timezone = '+08:00';
  dbConfig.dialectOptions = dbConfig.dialectOptions || {};
  dbConfig.dialectOptions.dateStrings = true;
  dbConfig.dialectOptions.decimalNumbers = true;
}

module.exports = dbConfig;