# VLSI Portal - Error Logging Only

## Overview
Your VLSI Portal now logs **ONLY ERRORS** - no more verbose logging cluttering your console or files.

## What Gets Logged
- **Database errors** - When database queries fail
- **Application errors** - When your code crashes or fails
- **Authentication errors** - When login/authorization fails
- **File upload errors** - When file operations fail
- **Uncaught exceptions** - When the server crashes
- **Unhandled promise rejections** - When async operations fail

## What Does NOT Get Logged
- ✅ Normal API requests (GET, POST, etc.)
- ✅ Successful database queries
- ✅ User login/logout activities
- ✅ File uploads that work fine
- ✅ General application flow

## Log Files Location
All error logs are stored in: `backend/logs/`

## Log File Types

### 1. Error Logs (`error-YYYY-MM-DD.log`)
- Contains all application errors
- Database query failures
- Authentication failures
- File operation errors

### 2. Exception Logs (`exceptions-YYYY-MM-DD.log`)
- Uncaught exceptions that crash the application
- Critical system failures

### 3. Rejection Logs (`rejections-YYYY-MM-DD.log`)
- Unhandled promise rejections
- Async operation failures

## How to View Errors

### Method 1: Simple Error Viewer (Recommended)
```bash
# Double-click this file or run:
view-errors.bat
```

### Method 2: Command Line
```bash
# View today's error log
type logs\error-2024-01-15.log

# View in real-time (Windows)
powershell Get-Content logs\error-2024-01-15.log -Wait -Tail 10
```

### Method 3: Using npm scripts
```bash
# View error logs
npm run logs:errors
```

## Example Error Logs

### Database Error
```
2024-01-15 10:30:20 [ERROR]: Database Query Error
Meta: {
  "query": "SELECT * FROM users WHERE email = ?",
  "params": ["user@example.com"],
  "duration": "150ms",
  "error": "ER_NO_SUCH_TABLE: Table 'vlsiportal.users' doesn't exist"
}
```

### Authentication Error
```
2024-01-15 10:30:15 [ERROR]: Authentication failed
Meta: {
  "userId": null,
  "email": "user@example.com",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0..."
}
```

### Application Error
```
2024-01-15 10:30:25 [ERROR]: Unhandled Error
Meta: {
  "message": "Cannot read property 'id' of undefined",
  "stack": "TypeError: Cannot read property 'id' of undefined\n    at /app/routes/queries.js:45:12",
  "url": "/api/queries/123",
  "method": "GET",
  "ip": "192.168.1.100"
}
```

## When to Check Logs

### Check logs when:
- ❌ Users report errors
- ❌ Application crashes
- ❌ Database operations fail
- ❌ File uploads don't work
- ❌ Authentication issues
- ❌ API endpoints return 500 errors

### Don't check logs when:
- ✅ Everything works fine
- ✅ Normal user activities
- ✅ Successful operations

## Quick Commands

```bash
# View errors (Windows)
view-errors.bat

# View today's errors
type logs\error-%date:~-4,4%-%date:~-10,2%-%date:~-7,2%.log

# Monitor errors in real-time
powershell Get-Content logs\error-%date:~-4,4%-%date:~-10,2%-%date:~-7,2%.log -Wait -Tail 5

# Check if there are any errors today
if exist logs\error-%date:~-4,4%-%date:~-10,2%-%date:~-7,2%.log (
    echo Errors found today!
) else (
    echo No errors today - everything is working fine!
)
```

## Log Rotation
- Error logs are automatically rotated daily
- Old logs are compressed after 14 days
- Maximum file size: 20MB per log file
- Automatic cleanup of old logs

## Benefits of Error-Only Logging

1. **Clean Console** - No more spam in your terminal
2. **Focused Debugging** - Only see what's actually broken
3. **Smaller Log Files** - Easier to manage and search
4. **Faster Performance** - Less I/O operations
5. **Clear Alerts** - When you see a log entry, it's important

## Troubleshooting

### If you see no error logs:
- ✅ **Good news!** Your application is running without errors
- Check if `logs` directory exists
- Verify the server is running

### If you see many error logs:
- ❌ **Action needed!** Your application has issues
- Check the error messages
- Fix the underlying problems
- Monitor if errors decrease after fixes

### If logs are not being created:
- Check if `logs` directory exists
- Verify write permissions
- Check if server is running
- Look for startup errors in console

## Summary

Now your logging system is **clean and focused**:
- ✅ **Only errors are logged**
- ✅ **Easy to find problems**
- ✅ **No console spam**
- ✅ **Small log files**
- ✅ **Clear error messages**

When something goes wrong, you'll know immediately by checking the error logs!
