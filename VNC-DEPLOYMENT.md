# VLSI Portal - VNC Machine Deployment Guide

## Overview
This guide will help you deploy the VLSI Portal application on your CentOS Linux 8 VNC machine with IP address `192.168.92.34`.

## Prerequisites
- CentOS Linux 8 VNC machine with IP `192.168.92.34`
- Internet connection for package installation
- Sudo privileges
- MySQL database already set up with the same name as in environment

## Quick Deployment

### 1. Transfer Files to VNC Machine
First, transfer your project files to the VNC machine:
```bash
# From your local machine, copy files to VNC machine
scp -r vlsiportal/ user@192.168.92.34:~/
```

### 2. Run Deployment Script
```bash
# SSH into your VNC machine
ssh user@192.168.92.34

# Navigate to project directory
cd ~/vlsiportal

# Make deployment script executable
chmod +x deploy-vnc.sh

# Run deployment script
./deploy-vnc.sh
```

## Manual Deployment Steps

### 1. System Preparation
```bash
# Update system packages
sudo yum update -y

# Install Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install MySQL
sudo yum install -y mysql-server mysql

# Start and enable MySQL
sudo systemctl start mysqld
sudo systemctl enable mysqld

# Install PM2 for process management
sudo npm install -g pm2
```

### 2. Configure Firewall
```bash
# Open required ports
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=5000/tcp
sudo firewall-cmd --reload
```

### 3. Database Setup
```bash
# Secure MySQL installation
sudo mysql_secure_installation

# Create database (if not exists)
mysql -u root -p -e "CREATE DATABASE vlsi_portal;"

# Import database schema
mysql -u root -p vlsi_portal < backend/config/database.sql
```

### 4. Application Setup
```bash
# Create application directory
mkdir -p ~/vlsi-portal
cd ~/vlsi-portal

# Copy project files
cp -r ~/vlsiportal/* .

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Build frontend for production
npm run build
```

### 5. Environment Configuration

#### Backend Configuration (`backend/.env`)
```env
# VLSI Portal Backend Environment Configuration
# For CentOS Linux 8 VNC Machine (192.168.92.34)

# Server Configuration
PORT=5000
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_actual_mysql_password
DB_NAME=vlsi_portal
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

#### Frontend Configuration (`frontend/.env`)
```env
# VLSI Portal Frontend Environment Configuration
# For CentOS Linux 8 VNC Machine (192.168.92.34)

# API Configuration
REACT_APP_API_URL=http://192.168.92.34:5000
REACT_APP_BACKEND_URL=http://192.168.92.34:5000

# Application Configuration
REACT_APP_NAME=VLSI Portal
REACT_APP_VERSION=1.0.0

# Development Configuration
REACT_APP_DEV_MODE=false
```

### 6. PM2 Configuration
Create `ecosystem.config.js` in the root directory:
```javascript
module.exports = {
  apps: [
    {
      name: 'vlsi-backend',
      script: './backend/server.js',
      cwd: './backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    },
    {
      name: 'vlsi-frontend',
      script: 'serve',
      cwd: './frontend',
      args: '-s build -l 3000',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

### 7. Install Serve for Frontend
```bash
# Install serve globally
sudo npm install -g serve
```

### 8. Start Application
```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

## Access URLs

Once deployed, you can access the application at:

- **Frontend**: http://192.168.92.34:3000
- **Backend API**: http://192.168.92.34:5000
- **Health Check**: http://192.168.92.34:5000/api/health
- **Uploads**: http://192.168.92.34:5000/uploads

## Management Commands

### PM2 Commands
```bash
# View application status
pm2 status

# View logs
pm2 logs

# Restart applications
pm2 restart all

# Stop applications
pm2 stop all

# Monitor applications
pm2 monit
```

### System Service
```bash
# Start service
sudo systemctl start vlsi-portal

# Stop service
sudo systemctl stop vlsi-portal

# Enable on boot
sudo systemctl enable vlsi-portal

# Check status
sudo systemctl status vlsi-portal
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   sudo netstat -tulpn | grep :5000
   
   # Kill the process
   sudo kill -9 <PID>
   ```

2. **MySQL Connection Issues**
   ```bash
   # Check MySQL status
   sudo systemctl status mysqld
   
   # Restart MySQL
   sudo systemctl restart mysqld
   ```

3. **Firewall Issues**
   ```bash
   # Check firewall status
   sudo firewall-cmd --list-all
   
   # Add ports if needed
   sudo firewall-cmd --permanent --add-port=3000/tcp
   sudo firewall-cmd --permanent --add-port=5000/tcp
   sudo firewall-cmd --reload
   ```

4. **Permission Issues**
   ```bash
   # Fix uploads directory permissions
   sudo chown -R $USER:$USER ~/vlsi-portal/backend/uploads
   sudo chmod -R 755 ~/vlsi-portal/backend/uploads
   ```

### Logs
```bash
# View PM2 logs
pm2 logs

# View system service logs
sudo journalctl -u vlsi-portal -f

# View MySQL logs
sudo tail -f /var/log/mysqld.log
```

## Security Considerations

1. **Change Default Passwords**
   - Update MySQL root password
   - Change JWT secret in backend/.env
   - Use strong passwords for all services

2. **Firewall Configuration**
   - Only open necessary ports (3000, 5000)
   - Consider using a reverse proxy for additional security

3. **SSL/HTTPS**
   - For production use, consider adding SSL certificates
   - Use Let's Encrypt for free SSL certificates

## Backup and Maintenance

### Database Backup
```bash
# Create backup
mysqldump -u root -p vlsi_portal > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
mysql -u root -p vlsi_portal < backup_file.sql
```

### Application Backup
```bash
# Backup application files
tar -czf vlsi-portal-backup-$(date +%Y%m%d).tar.gz ~/vlsi-portal/

# Backup uploads
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz ~/vlsi-portal/backend/uploads/
```

## Support

If you encounter any issues during deployment, check:
1. All services are running: `pm2 status`
2. Ports are accessible: `netstat -tulpn | grep :3000`
3. Database connection: Test MySQL connection
4. Logs for errors: `pm2 logs`

For additional help, refer to the application logs and system documentation.
