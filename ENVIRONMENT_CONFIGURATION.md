# Environment Configuration Guide

## Overview
This document explains the environment configuration changes made to remove hardcoded URLs and IPs from the VLSI Portal codebase.

## Changes Made

### 1. Environment Files Updated

#### Backend Environment Files
- **`backend/.env`** - Development environment (uses localhost)
- **`backend/.env.production`** - Production environment (uses vlsiforum.sumedhait.com)

#### Frontend Environment Files
- **`frontend/.env`** - Development environment (uses localhost)
- **`frontend/.env.production`** - Production environment (uses vlsiforum.sumedhait.com)

### 2. Removed Hardcoded URLs and IPs

#### Before:
- `http://192.168.92.34:5000/uploads/` (hardcoded IP)
- `http://3.6.88.118:3000` (hardcoded IP)
- Multiple hardcoded localhost URLs

#### After:
- Uses environment variables: `REACT_APP_API_URL`, `REACT_APP_UPLOAD_BASE_URL`
- Fallback to localhost for development
- Production uses `http://vlsiforum.sumedhait.com`

### 3. Files Modified

#### Backend Files:
- `backend/server.js` - Updated CORS configuration to use environment variables
- `backend/.env` - Added CORS_ORIGINS and BASE_URL configuration
- `backend/.env.production` - Created production environment file

#### Frontend Files:
- `frontend/src/App.js` - Updated to use environment variables
- `frontend/src/components/queries/QueryDetail.js` - Updated image URLs to use environment variables
- `frontend/src/config/api.js` - Created utility functions for URL management
- `frontend/.env` - Updated with proper environment variables
- `frontend/.env.production` - Updated production configuration

#### Configuration Files:
- `nginx-vlsi-config.conf` - Updated server_name to use domain instead of IP
- `deploy-vnc.sh` - Updated deployment script to use domain

### 4. Environment Variables

#### Backend Environment Variables:
```bash
# Development (.env)
BASE_URL=http://localhost:3000
UPLOAD_BASE_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3001,http://localhost:3000,http://127.0.0.1:3001,http://127.0.0.1:3000,http://vlsiforum.sumedhait.com

# Production (.env.production)
BASE_URL=http://vlsiforum.sumedhait.com
UPLOAD_BASE_URL=http://vlsiforum.sumedhait.com
CORS_ORIGINS=http://vlsiforum.sumedhait.com,http://localhost:3001,http://localhost:3000
```

#### Frontend Environment Variables:
```bash
# Development (.env)
REACT_APP_API_URL=http://localhost:3000
REACT_APP_UPLOAD_BASE_URL=http://localhost:3000

# Production (.env.production)
REACT_APP_API_URL=http://vlsiforum.sumedhait.com
REACT_APP_UPLOAD_BASE_URL=http://vlsiforum.sumedhait.com
```

### 5. URL Construction

The application now uses utility functions for URL construction:

```javascript
// frontend/src/config/api.js
const getApiUrl = () => {
  return process.env.REACT_APP_API_URL || 'http://localhost:3000';
};

const getUploadUrl = () => {
  return process.env.REACT_APP_UPLOAD_BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:3000';
};

const getImageUrl = (filename) => {
  return `${getUploadUrl()}/uploads/${filename}`;
};
```

### 6. Deployment Instructions

#### For Development:
1. Use `backend/.env` and `frontend/.env` files
2. URLs will automatically use localhost

#### For Production:
1. Use `backend/.env.production` and `frontend/.env.production` files
2. URLs will automatically use `http://vlsiforum.sumedhait.com`

### 7. Benefits

1. **No more hardcoded IPs** - All URLs are configurable
2. **Environment-specific configuration** - Different settings for dev/prod
3. **Easy deployment** - Just switch environment files
4. **Maintainable** - Centralized URL management
5. **Secure** - No sensitive information in code

### 8. Migration Notes

- All existing functionality preserved
- Backward compatibility maintained with fallbacks
- No breaking changes to existing features
- Easy to switch between environments
