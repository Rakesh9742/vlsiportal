const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'vlsiportal'
};

async function setupAdmin() {
  try {
    // Create database connection
    const connection = await mysql.createConnection(dbConfig);
    
    
    // Hash the admin password
    const adminPassword = 'admin123'; // Change this to your desired admin password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    
    // Check if admin user already exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE username = ? AND role = ?',
      ['admin', 'admin']
    );
    
    if (existingUsers.length > 0) {
      
      // Update existing admin password
      await connection.execute(
        'UPDATE users SET password = ? WHERE username = ? AND role = ?',
        [hashedPassword, 'admin', 'admin']
      );
      
    } else {
      
      // Create new admin user
      await connection.execute(
        'INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)',
        ['admin', hashedPassword, 'admin', 'System Administrator']
      );
      
    }
    
    // Display admin credentials
    
    await connection.end();
    
  } catch (error) {
    process.exit(1);
  }
}

// Run the setup
setupAdmin();
