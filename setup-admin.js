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
    
    console.log('🔗 Connected to database');
    
    // Hash the admin password
    const adminPassword = 'admin123'; // Change this to your desired admin password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    console.log('🔐 Password hashed successfully');
    
    // Check if admin user already exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE username = ? AND role = ?',
      ['admin', 'admin']
    );
    
    if (existingUsers.length > 0) {
      console.log('⚠️  Admin user already exists. Updating password...');
      
      // Update existing admin password
      await connection.execute(
        'UPDATE users SET password = ? WHERE username = ? AND role = ?',
        [hashedPassword, 'admin', 'admin']
      );
      
      console.log('✅ Admin password updated successfully');
    } else {
      console.log('👤 Creating new admin user...');
      
      // Create new admin user
      await connection.execute(
        'INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)',
        ['admin', hashedPassword, 'admin', 'System Administrator']
      );
      
      console.log('✅ Admin user created successfully');
    }
    
    // Display admin credentials
    console.log('\n🎉 Admin setup completed!');
    console.log('📋 Admin credentials:');
    console.log(`   Username: admin`);
    console.log(`   Password: ${adminPassword}`);
    console.log('\n⚠️  Please change the password after first login for security!');
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error setting up admin:', error);
    process.exit(1);
  }
}

// Run the setup
setupAdmin();
