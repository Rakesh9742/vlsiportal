const mysql = require('mysql2');
const dotenv = require('dotenv');

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

// Test database connection
const testConnection = async () => {
  try {
    const connection = await promisePool.getConnection();
    connection.release();
  } catch (error) {
    
    process.exit(1);
  }
};

// Test connection on startup
testConnection();

module.exports = promisePool; 