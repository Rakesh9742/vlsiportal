const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

console.log('🔧 Database Configuration:');
console.log(`   Host: ${process.env.DB_HOST}`);
console.log(`   User: ${process.env.DB_USER}`);
console.log(`   Database: ${process.env.DB_NAME}`);
console.log(`   Port: ${process.env.DB_PORT}`);

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
    console.log('🔄 Testing database connection...');
    const connection = await promisePool.getConnection();
    console.log('✅ Database connection successful!');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
    console.error('   Errno:', error.errno);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   💡 Check your database username and password');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   💡 Make sure MySQL server is running');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('   💡 Database does not exist. Run the SQL script first');
    }
    
    process.exit(1);
  }
};

// Test connection on startup
testConnection();

module.exports = promisePool; 