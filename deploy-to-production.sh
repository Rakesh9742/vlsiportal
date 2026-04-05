#!/bin/bash

# vlsiforum Production Deployment Script
# Run this on your EC2 server

echo "=========================================="
echo "vlsiforum Production Deployment"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Navigate to project root
cd "$(dirname "$0")" || exit

echo ""
echo "Step 1: Setting up Frontend Environment..."
cd frontend || exit

# Create .env for production
cat > .env << 'EOF'
REACT_APP_API_URL=https://vlsiforum.sumedhait.com
REACT_APP_UPLOAD_BASE_URL=https://vlsiforum.sumedhait.com
PORT=3001
EOF

echo -e "${GREEN}✓ Frontend .env configured${NC}"

# Build frontend
echo ""
echo "Step 2: Building Frontend (this may take a few minutes)..."
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend build successful${NC}"
else
    echo -e "${RED}✗ Frontend build failed${NC}"
    exit 1
fi

# Go back to root
cd ..

echo ""
echo "Step 3: Configuring Backend..."
cd backend || exit

# Create production .env
cat > .env << 'EOF'
# vlsiforum Backend Environment Configuration

# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root
DB_NAME=vlsi_portal
DB_PORT=3306

# JWT Configuration
JWT_SECRET=vlsi_portal_production_jwt_secret_2024_secure_key
JWT_EXPIRES_IN=24h

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# CORS Configuration
CORS_ORIGINS=http://localhost:3001,http://localhost:3000,http://127.0.0.1:3001,http://127.0.0.1:3000,http://vlsiforum.sumedhait.com,https://vlsiforum.sumedhait.com

# Base URL Configuration
BASE_URL=https://vlsiforum.sumedhait.com
UPLOAD_BASE_URL=https://vlsiforum.sumedhait.com
EOF

echo -e "${GREEN}✓ Backend .env configured${NC}"

# Go back to root
cd ..

echo ""
echo "Step 4: Starting Services with PM2..."
echo "Note: Make sure you have nginx configured to serve the frontend/build folder"

# Install serve if not installed
if ! command -v serve &> /dev/null; then
    echo "Installing serve..."
    npm install -g serve
fi

# Kill existing frontend process
pm2 delete frontend 2>/dev/null

# Start frontend serving production build
pm2 start serve --name frontend -- -s frontend/build -l 3001

# Restart backend
pm2 restart backend || pm2 start backend/server.js --name backend

# Save PM2 config
pm2 save

echo ""
echo -e "${GREEN}✓ Services started with PM2${NC}"

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Your application should be available at:"
echo "Frontend: http://$(curl -s ifconfig.me):3001"
echo "Backend: http://$(curl -s ifconfig.me):3000"
echo "Production: https://vlsiforum.sumedhait.com"
echo ""
echo "Check status with: pm2 status"
echo "View logs with: pm2 logs"
echo ""

