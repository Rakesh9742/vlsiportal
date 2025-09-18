# VLSI Portal Logging System Guide

## Overview
Your VLSI Portal now has a comprehensive logging system that will help you track errors, debug issues, and monitor application performance.

## Log Files Location
All log files are stored in: `backend/logs/`

## Log File Types

### 1. Error Logs (`error-YYYY-MM-DD.log`)
- Contains only ERROR level messages
- Critical for debugging application failures
- Includes stack traces and error details

### 2. Combined Logs (`combined-YYYY-MM-DD.log`)
- Contains ALL log levels (error, warn, info, debug)
- Complete application activity log
- Useful for comprehensive debugging

### 3. Application Logs (`app-YYYY-MM-DD.log`)
- Contains INFO level and above
- General application activity
- Good for monitoring normal operations

### 4. Exception Logs (`exceptions-YYYY-MM-DD.log`)
- Uncaught exceptions that crash the application
- Critical for identifying unexpected crashes

### 5. Rejection Logs (`rejections-YYYY-MM-DD.log`)
- Unhandled promise rejections
- Important for async operation debugging

## Log Levels

- **ERROR**: Critical errors that need immediate attention
- **WARN**: Warning messages about potential issues
- **INFO**: General information about application flow
- **DEBUG**: Detailed debugging information

## How to View Logs

### Method 1: Using the Log Viewer Script (Recommended)
```bash
# Navigate to backend directory
cd backend

# List all available log files
node scripts/view-logs.js list

# View a specific log file (last 50 lines)
node scripts/view-logs.js view error-2024-01-15.log

# View more lines from a specific file
node scripts/view-logs.js view combined-2024-01-15.log 100

# Show only error logs
node scripts/view-logs.js errors

# Show recent logs from all files
node scripts/view-logs.js recent

# Show help
node scripts/view-logs.js help
```

### Method 2: Direct File Access
```bash
# View error logs
type logs\error-2024-01-15.log

# View combined logs
type logs\combined-2024-01-15.log

# View in real-time (Windows)
powershell Get-Content logs\combined-2024-01-15.log -Wait -Tail 10
```

## What Gets Logged

### 1. Request/Response Logging
- Every API request is logged with:
  - Method (GET, POST, PUT, DELETE)
  - URL
  - Response status code
  - Response time
  - User ID (if authenticated)
  - IP address

### 2. Database Operations
- All database queries are logged with:
  - SQL query (truncated for security)
  - Query parameters
  - Execution time
  - Error details (if any)

### 3. Authentication Events
- Login attempts
- Token validation
- Authorization failures

### 4. File Uploads
- Upload attempts
- File processing
- Upload errors

### 5. Application Errors
- Unhandled exceptions
- Validation errors
- Business logic errors

## Log Rotation
- Log files are automatically rotated daily
- Old logs are compressed (zipped) after 7-14 days
- Maximum file size: 20MB per log file
- Automatic cleanup of old logs

## Environment Configuration

### Development Mode
- Logs are displayed in console with colors
- More verbose logging
- Stack traces included in responses

### Production Mode
- Logs only written to files
- Less verbose logging
- Stack traces hidden from API responses

## Common Error Scenarios

### 1. Database Connection Issues
Look for: `Database connection failed` in error logs
- Check database credentials
- Verify database server is running
- Check network connectivity

### 2. Authentication Problems
Look for: `UnauthorizedError` or `JWT` related errors
- Check token expiration
- Verify secret keys
- Check user permissions

### 3. File Upload Issues
Look for: `multer` or `upload` related errors
- Check file size limits
- Verify upload directory permissions
- Check file type restrictions

### 4. API Route Errors
Look for: `Route not found` or specific endpoint errors
- Check route definitions
- Verify request parameters
- Check middleware configuration

## Debugging Tips

### 1. Start with Error Logs
Always check error logs first when something goes wrong:
```bash
node scripts/view-logs.js errors
```

### 2. Check Recent Activity
Look at recent logs to see what happened before the error:
```bash
node scripts/view-logs.js recent
```

### 3. Monitor Real-time
Watch logs in real-time during testing:
```bash
powershell Get-Content logs\combined-2024-01-15.log -Wait -Tail 20
```

### 4. Search for Specific Issues
Use grep or findstr to search for specific errors:
```bash
findstr "error" logs\combined-2024-01-15.log
findstr "database" logs\error-2024-01-15.log
```

## Log Analysis Examples

### Example 1: User Login Issue
```
2024-01-15 10:30:15 [ERROR]: Authentication failed
Meta: {
  "userId": null,
  "email": "user@example.com",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0..."
}
```

### Example 2: Database Query Error
```
2024-01-15 10:30:20 [ERROR]: Database Query Error
Meta: {
  "query": "SELECT * FROM users WHERE email = ?",
  "params": ["user@example.com"],
  "duration": "150ms",
  "error": "ER_NO_SUCH_TABLE: Table 'vlsiportal.users' doesn't exist"
}
```

### Example 3: API Request Error
```
2024-01-15 10:30:25 [WARN]: Request Completed with Error
Meta: {
  "method": "POST",
  "url": "/api/auth/login",
  "statusCode": 500,
  "duration": "200ms",
  "ip": "192.168.1.100",
  "userId": null
}
```

## Best Practices

1. **Check logs regularly** - Don't wait for users to report issues
2. **Monitor error rates** - High error rates indicate problems
3. **Use log levels appropriately** - Don't log everything as error
4. **Include context** - Log relevant user and request information
5. **Rotate logs** - Keep log files manageable
6. **Secure sensitive data** - Don't log passwords or tokens

## Troubleshooting

### If logs are not being created:
1. Check if `logs` directory exists
2. Verify write permissions
3. Check if server is running
4. Look for startup errors

### If logs are too verbose:
1. Set `LOG_LEVEL=warn` in environment variables
2. Restart the server

### If logs are missing information:
1. Set `LOG_LEVEL=debug` in environment variables
2. Check if routes are using asyncHandler
3. Verify error handling middleware is loaded

## Quick Commands Reference

```bash
# Start server with logging
npm start

# View all available logs
node scripts/view-logs.js list

# View today's errors
node scripts/view-logs.js view error-$(Get-Date -Format "yyyy-MM-dd").log

# Monitor logs in real-time
powershell Get-Content logs\combined-$(Get-Date -Format "yyyy-MM-dd").log -Wait -Tail 10

# Search for specific errors
findstr "ERROR" logs\combined-$(Get-Date -Format "yyyy-MM-dd").log
```

This logging system will help you identify and fix issues quickly. Always check the logs when something goes wrong!
