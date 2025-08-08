# VLSI Portal - Complete File Transfer Guide

## 🎯 Overview
This guide will help you transfer all VLSI Portal files to your CentOS Linux 8 VNC machine (192.168.92.34) with proper setup and configuration.

## 📋 Prerequisites

### On Your Local Machine:
- SSH client (Windows: PuTTY, WSL, or Git Bash)
- SCP client for file transfer
- Your VLSI Portal project files

### On VNC Machine (192.168.92.34):
- SSH server enabled
- Internet connection
- Sudo privileges
- CentOS Linux 8

## 🚀 Step-by-Step File Transfer Process

### Step 1: Prepare Your Local Files

First, make sure you have all the necessary files in your local project:

```bash
# Check your current directory structure
ls -la

# Ensure you have these key files:
# - backend/ (with all files)
# - frontend/ (with all files)
# - deploy-vnc.sh
# - VNC-DEPLOYMENT.md
# - FILE-TRANSFER-GUIDE.md
```

### Step 2: Test SSH Connection to VNC Machine

```bash
# Test SSH connection (replace 'user' with your actual username)
ssh user@192.168.92.34

# If connection works, exit back to local machine
exit
```

### Step 3: Create Backup of Current Files (Optional)

```bash
# Create a backup of your current project
tar -czf vlsiportal-backup-$(date +%Y%m%d_%H%M%S).tar.gz vlsiportal/
echo "Backup created: vlsiportal-backup-$(date +%Y%m%d_%H%M%S).tar.gz"
```

### Step 4: Transfer Files to VNC Machine

#### Option A: Using SCP (Recommended)
```bash
# Transfer entire project directory
scp -r vlsiportal/ user@192.168.92.34:~/

# Verify transfer was successful
ssh user@192.168.92.34 "ls -la ~/vlsiportal/"
```

#### Option B: Using rsync (More Efficient)
```bash
# Install rsync if not available (Windows: use WSL or Git Bash)
rsync -avz --progress vlsiportal/ user@192.168.92.34:~/vlsiportal/
```

#### Option C: Using tar and scp (For Large Projects)
```bash
# Create compressed archive
tar -czf vlsiportal.tar.gz vlsiportal/

# Transfer compressed file
scp vlsiportal.tar.gz user@192.168.92.34:~/

# SSH into VNC machine and extract
ssh user@192.168.92.34
cd ~
tar -xzf vlsiportal.tar.gz
rm vlsiportal.tar.gz
```

### Step 5: Verify File Transfer

```bash
# SSH into VNC machine
ssh user@192.168.92.34

# Check if files were transferred correctly
cd ~/vlsiportal
ls -la

# Verify key directories exist
ls -la backend/
ls -la frontend/

# Check if configuration files exist
ls -la backend/.env
ls -la frontend/.env
ls -la deploy-vnc.sh
```

### Step 6: Set Proper Permissions

```bash
# Make deployment script executable
chmod +x deploy-vnc.sh

# Set proper permissions for uploads directory
mkdir -p backend/uploads
chmod 755 backend/uploads
```

### Step 7: Update Environment Files

#### Update Backend Environment (backend/.env)
```bash
# Edit the backend environment file
nano backend/.env
```

Make sure it contains:
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

#### Update Frontend Environment (frontend/.env)
```bash
# Edit the frontend environment file
nano frontend/.env
```

Make sure it contains:
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

### Step 8: Run Deployment Script

```bash
# Run the deployment script
./deploy-vnc.sh
```

### Step 9: Database Setup

```bash
# Secure MySQL installation
sudo mysql_secure_installation

# Create database
mysql -u root -p -e "CREATE DATABASE vlsi_portal;"

# Import database schema
mysql -u root -p vlsi_portal < backend/config/database.sql

# Verify database was created
mysql -u root -p -e "USE vlsi_portal; SHOW TABLES;"
```

### Step 10: Start the Application

```bash
# Navigate to project directory
cd ~/vlsi-portal

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

## 🔍 Verification Steps

### Check Application Status
```bash
# Check PM2 status
pm2 status

# Check if ports are listening
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :5000

# Test backend health
curl http://192.168.92.34:5000/api/health
```

### Test Frontend Access
```bash
# Test frontend (should return HTML)
curl http://192.168.92.34:3000
```

## 🌐 Access URLs

Once everything is set up, you can access:

- **Frontend**: http://192.168.92.34:3000
- **Backend API**: http://192.168.92.34:5000
- **Health Check**: http://192.168.92.34:5000/api/health

## 🛠️ Troubleshooting

### Common Transfer Issues

1. **SSH Connection Failed**
   ```bash
   # Check if SSH is enabled on VNC machine
   sudo systemctl status sshd
   
   # If not running, start it
   sudo systemctl start sshd
   sudo systemctl enable sshd
   ```

2. **Permission Denied**
   ```bash
   # Check file permissions
   ls -la ~/vlsiportal/
   
   # Fix permissions if needed
   chmod -R 755 ~/vlsiportal/
   ```

3. **Files Missing After Transfer**
   ```bash
   # Check what was transferred
   find ~/vlsiportal -type f | wc -l
   
   # Compare with local files
   # On local machine:
   find vlsiportal -type f | wc -l
   ```

4. **Database Connection Issues**
   ```bash
   # Check MySQL status
   sudo systemctl status mysqld
   
   # Test MySQL connection
   mysql -u root -p -e "SELECT 1;"
   ```

### Network Issues

1. **Firewall Blocking Transfer**
   ```bash
   # Check firewall status
   sudo firewall-cmd --list-all
   
   # Temporarily disable firewall for testing
   sudo systemctl stop firewalld
   ```

2. **Port Access Issues**
   ```bash
   # Check if ports are open
   sudo firewall-cmd --list-ports
   
   # Add ports if needed
   sudo firewall-cmd --permanent --add-port=3000/tcp
   sudo firewall-cmd --permanent --add-port=5000/tcp
   sudo firewall-cmd --reload
   ```

## 📊 File Transfer Checklist

- [ ] SSH connection to VNC machine works
- [ ] All project files transferred successfully
- [ ] Environment files updated with correct IP addresses
- [ ] Deployment script is executable
- [ ] Database created and schema imported
- [ ] Application starts without errors
- [ ] Frontend accessible at http://192.168.92.34:3000
- [ ] Backend API accessible at http://192.168.92.34:5000
- [ ] Health check endpoint responds correctly

## 🔧 Quick Commands Reference

```bash
# Transfer files
scp -r vlsiportal/ user@192.168.92.34:~/

# SSH into VNC machine
ssh user@192.168.92.34

# Check application status
pm2 status

# View logs
pm2 logs

# Restart application
pm2 restart all

# Check ports
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :5000
```

## 📞 Support

If you encounter issues during file transfer:

1. **Check SSH connectivity**: `ssh user@192.168.92.34`
2. **Verify file transfer**: `ls -la ~/vlsiportal/`
3. **Check application logs**: `pm2 logs`
4. **Test network connectivity**: `ping 192.168.92.34`

The VLSI Portal should now be successfully transferred and running on your CentOS Linux 8 VNC machine!
