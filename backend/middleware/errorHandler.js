const { error, warn, info } = require('../config/logger');

// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  // Log the error with full details
  error('Unhandled Error', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.user ? req.user.id : null,
    body: req.body,
    query: req.query,
    params: req.params
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  // Determine status code
  let statusCode = err.statusCode || err.status || 500;
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
  } else if (err.name === 'CastError') {
    statusCode = 400;
  } else if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
  } else if (err.code === 'ER_NO_SUCH_TABLE') {
    statusCode = 500;
  }

  // Prepare error response
  const errorResponse = {
    success: false,
    message: isDevelopment ? err.message : 'Internal Server Error',
    ...(isDevelopment && { stack: err.stack }),
    timestamp: new Date().toISOString()
  };

  // Add validation errors if present
  if (err.errors) {
    errorResponse.errors = err.errors;
  }

  res.status(statusCode).json(errorResponse);
};

// 404 handler for undefined routes
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  
  warn('Route Not Found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent')
  });
  
  next(error);
};

// Async error wrapper to catch async errors
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  info('Incoming Request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.user ? req.user.id : null
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    
    // Log response
    if (res.statusCode >= 400) {
      warn('Request Completed with Error', {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip || req.connection.remoteAddress,
        userId: req.user ? req.user.id : null
      });
    } else {
      info('Request Completed', {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip || req.connection.remoteAddress,
        userId: req.user ? req.user.id : null
      });
    }
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  requestLogger
};
