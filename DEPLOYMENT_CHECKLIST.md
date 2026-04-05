# Production Deployment Checklist

## Current Issue
Your production site at `https://vlsiforum.sumedhait.com` is serving a development build that tries to connect to `localhost:3000` instead of the production API.

## What You Need To Do

### On Your EC2 Server:

#### 1. Stop Current Frontend (if running in dev mode)
```bash
# Find the process
ps aux | grep node

# Stop the development server if it's running
pm2 stop frontend
# OR
kill <process-id>
```

#### 2. Create Production Environment File on EC2
SSH to your server and create/update the frontend .env file:

```bash
cd /path/to/vlsiportal/frontend
nano .env
```

Add this content:
```
REACT_APP_API_URL=https://vlsiforum.sumedhait.com
REACT_APP_UPLOAD_BASE_URL=https://vlsiforum.sumedhait.com
PORT=3001
```

#### 3. Build the Frontend with Production Settings
```bash
cd /path/to/vlsiportal/frontend
npm run build
```

#### 4. Serve the Production Build
You have two options:

**Option A: Using PM2 with serve**
```bash
npm install -g serve
pm2 delete frontend 2>/dev/null
pm2 start serve --name frontend -- -s /path/to/vlsiportal/frontend/build -l 3001
pm2 save
```

**Option B: Using nginx to serve static files**
```bash
# Update your nginx config to point to the build folder
sudo nano /etc/nginx/sites-available/vlsiforum

# Set root to: /path/to/vlsiportal/frontend/build
# Then reload nginx:
sudo nginx -t
sudo systemctl reload nginx
```

#### 5. Update Backend .env for Production
```bash
cd /path/to/vlsiportal/backend
nano .env
```

Update these lines:
```
NODE_ENV=production
BASE_URL=https://vlsiforum.sumedhait.com
UPLOAD_BASE_URL=https://vlsiforum.sumedhait.com
```

#### 6. Restart Backend
```bash
pm2 restart backend
# OR
pm2 restart all
```

### Verify Everything Works

1. Visit: https://vlsiforum.sumedhait.com/login
2. Open browser developer tools (F12)
3. Check the Console tab - API calls should go to `vlsiforum.sumedhait.com` (NOT localhost)
4. Check the Network tab - verify requests go to your production domain
5. Try logging in

### Current Status (Based on Your Output)

✅ Backend running on port 3000
✅ Frontend running on port 3001
❌ Frontend is serving development build (should be production build)
❌ Frontend trying to connect to localhost instead of production domain

## Quick Fix Commands

If you want to quickly test if the production build works:

```bash
# SSH to your EC2 server
# Navigate to project
cd vlsiportal/frontend

# Copy the new build from your local machine OR rebuild on server
scp -r frontend/build user@your-ec2-ip:/path/to/vlsiportal/frontend/

# OR rebuild directly on server:
npm run build

# Then update your nginx/pm2 to serve from frontend/build folder
```

## Important Notes

1. **Development mode** (react-dev.js files) should NEVER be deployed to production
2. **Production mode** uses optimized, minified builds
3. The `.env.production` file I created earlier is correct - but you need to actually BUILD with it
4. Always rebuild when environment variables change

