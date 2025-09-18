const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for log messages
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Add stack trace for errors
    if (stack) {
      logMessage += `\nStack: ${stack}`;
    }
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      logMessage += `\nMeta: ${JSON.stringify(meta, null, 2)}`;
    }
    
    return logMessage;
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    let logMessage = `${timestamp} ${level}: ${message}`;
    if (stack) {
      logMessage += `\n${stack}`;
    }
    return logMessage;
  })
);

// Create the logger - ONLY FOR ERRORS
const logger = winston.createLogger({
  level: 'error', // Only log errors
  format: logFormat,
  defaultMeta: { service: 'vlsiportal-backend' },
  transports: [
    // Error log file - only errors
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true
    })
  ],
  
  // Handle exceptions and rejections
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true
    })
  ],
  
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true
    })
  ]
});

// Add console transport for development - ONLY ERRORS
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    level: 'error', // Only show errors in console
    format: consoleFormat
  }));
}

// Helper functions - ONLY FOR ERRORS
const logHelpers = {
  error: (message, meta = {}) => {
    logger.error(message, meta);
  },
  
  // Only log database errors, not successful queries
  dbQuery: (query, params, duration, error = null) => {
    if (error) {
      const logData = {
        query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
        params: params,
        duration: `${duration}ms`,
        error: error.message
      };
      logger.error('Database Query Error', logData);
    }
    // Don't log successful queries
  }
};

module.exports = { logger, ...logHelpers };
