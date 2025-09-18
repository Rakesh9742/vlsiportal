const mysql = require('mysql2');
const dotenv = require('dotenv');
const { error: logError, dbQuery } = require('./logger');

dotenv.config();


const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const promisePool = pool.promise();

// Wrap the execute method to add logging
const originalExecute = promisePool.execute.bind(promisePool);
promisePool.execute = async function(sql, params) {
  const start = Date.now();
  try {
    const result = await originalExecute(sql, params);
    const duration = Date.now() - start;
    dbQuery(sql, params, duration);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    dbQuery(sql, params, duration, error);
    throw error;
  }
};

// Wrap the query method to add logging
const originalQuery = promisePool.query.bind(promisePool);
promisePool.query = async function(sql, params) {
  const start = Date.now();
  try {
    const result = await originalQuery(sql, params);
    const duration = Date.now() - start;
    dbQuery(sql, params, duration);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    dbQuery(sql, params, duration, error);
    throw error;
  }
};

// Test database connection
const testConnection = async () => {
  try {
    const connection = await promisePool.getConnection();
    connection.release();
    console.log('Database connection established successfully');
  } catch (error) {
    logError('Database connection failed', {
      message: error.message,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });
    process.exit(1);
  }
};

// Test connection on startup
testConnection();

module.exports = promisePool; 