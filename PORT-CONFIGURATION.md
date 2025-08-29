# VLSI Portal Port Configuration

## Overview
The VLSI Portal has been configured to use specific ports for both development and production environments:

- **Frontend**: Port 420
- **Backend**: Port 520

## Development Environment

### Windows
```bash
# Option 1: Use the Windows batch script
npm run dev-windows

# Option 2: Use the standard npm script
npm run dev
```

### Unix/Linux/macOS
```bash
# Option 1: Use the Unix shell script
npm run dev-unix

# Option 2: Use the standard npm script
npm run dev
```

### Manual Start
```bash
# Start backend on port 520
cd backend
npm run dev

# Start frontend on port 420 (in a new terminal)
cd frontend
npm run dev
```

## Production Environment (VNC Server)

### Access URLs
- **Frontend**: http://192.168.92.34:420
- **Backend API**: http://192.168.92.34:520
- **Health Check**: http://192.168.92.34:520/api/health

### Deployment
```bash
# Run the deployment script
./deploy-vnc.sh
```

## Environment Files

### Frontend (.env)
```env
# API Configuration - Primary URL (localhost for development)
REACT_APP_API_URL=http://localhost:520

# Backup API URLs (production)
REACT_APP_BACKUP_API_URL=http://192.168.92.34:520

# Frontend Port Configuration
PORT=420
```

### Backend (.env)
```env
# Server Configuration
PORT=520
NODE_ENV=production
```

## CORS Configuration

The backend CORS configuration includes both localhost and production URLs:

```javascript
const corsOptions = {
  origin: [
    // Localhost URLs
    'http://localhost:420',
    'http://127.0.0.1:420',
    
    // Production URLs (VNC machine)
    'http://192.168.92.34:420',
    'http://192.168.122.1:420',
    
    // Additional local network URLs
    'http://192.168.1.100:420',
    'http://192.168.1.101:420',
    'http://192.168.0.100:420',
    'http://192.168.0.101:420'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

## Troubleshooting

### Port Already in Use
If you get a "port already in use" error:

1. **Windows**: 
   ```cmd
   netstat -ano | findstr :420
   netstat -ano | findstr :520
   taskkill /PID <PID> /F
   ```

2. **Unix/Linux**:
   ```bash
   lsof -i :420
   lsof -i :520
   kill -9 <PID>
   ```

### Firewall Issues
Make sure the ports are open in your firewall:

- **Windows**: Add ports 420 and 520 to Windows Firewall
- **Linux**: Use `sudo ufw allow 420` and `sudo ufw allow 520`
- **VNC Server**: The deployment script automatically configures the firewall

## Switching Between Environments

### Localhost to Production
```bash
npm run switch-production
```

### Production to Localhost
```bash
npm run switch-localhost
```

## API Base URL Configuration

The frontend automatically detects the environment and uses the appropriate API URL:

- **Localhost**: http://localhost:520
- **Production**: http://192.168.92.34:520

The configuration is handled in `frontend/src/App.js`:

```javascript
const getApiUrl = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return process.env.REACT_APP_API_URL || 'http://localhost:520';
  }
  return process.env.REACT_APP_BACKUP_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:520';
};
```
