#!/bin/bash

# VLSI Portal Deployment Script for CentOS Linux 8 VNC Machine
# IP: 192.168.92.34

echo "🚀 Starting VLSI Portal Deployment on CentOS Linux 8..."
echo "📍 Target IP: 192.168.92.34"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

print_status "Updating system packages..."
sudo yum update -y

print_status "Installing Node.js and npm..."
# Install Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

print_status "Installing MySQL..."
sudo yum install -y mysql-server mysql

print_status "Starting and enabling MySQL service..."
sudo systemctl start mysqld
sudo systemctl enable mysqld

print_status "Installing PM2 for process management..."
sudo npm install -g pm2

print_status "Setting up firewall..."
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=5000/tcp
sudo firewall-cmd --reload

print_status "Creating application directory..."
mkdir -p ~/vlsi-portal
cd ~/vlsi-portal

print_status "Installing backend dependencies..."
cd backend
npm install

print_status "Setting up database..."
# You'll need to manually configure MySQL password and create database
print_warning "Please configure MySQL password and create database manually:"
echo "1. Run: sudo mysql_secure_installation"
echo "2. Create database: CREATE DATABASE vlsi_portal;"
echo "3. Update backend/.env with your MySQL password"

print_status "Installing frontend dependencies..."
cd ../frontend
npm install

print_status "Building frontend for production..."
npm run build

print_status "Setting up PM2 ecosystem file..."
cd ..
cat > ecosystem.config.js << 'EOF'
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
EOF

print_status "Installing serve for frontend hosting..."
npm install -g serve

print_status "Creating startup script..."
cat > start-vlsi.sh << 'EOF'
#!/bin/bash
cd ~/vlsi-portal
pm2 start ecosystem.config.js
pm2 save
pm2 startup
EOF

chmod +x start-vlsi.sh

print_status "Creating systemd service..."
sudo tee /etc/systemd/system/vlsi-portal.service > /dev/null << EOF
[Unit]
Description=VLSI Portal Application
After=network.target

[Service]
Type=forking
User=$USER
WorkingDirectory=/home/$USER/vlsi-portal
ExecStart=/home/$USER/vlsi-portal/start-vlsi.sh
Restart=always

[Install]
WantedBy=multi-user.target
EOF

print_status "Enabling systemd service..."
sudo systemctl enable vlsi-portal.service

print_status "Deployment completed!"
echo ""
echo "🎉 VLSI Portal has been deployed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Configure MySQL password in backend/.env"
echo "2. Create database: mysql -u root -p -e 'CREATE DATABASE vlsi_portal;'"
echo "3. Import database schema: mysql -u root -p vlsi_portal < backend/config/database.sql"
echo "4. Start the application: ./start-vlsi.sh"
echo ""
echo "🌐 Access URLs:"
echo "   Frontend: http://192.168.92.34:3000"
echo "   Backend API: http://192.168.92.34:5000"
echo "   Health Check: http://192.168.92.34:5000/api/health"
echo ""
echo "🔧 Management Commands:"
echo "   View logs: pm2 logs"
echo "   Restart: pm2 restart all"
echo "   Stop: pm2 stop all"
echo "   Status: pm2 status"
