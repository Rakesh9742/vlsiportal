const express = require('express');
const fs = require('fs');
const path = require('path');
const { auth, checkRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { error: logError } = require('../config/logger');

const router = express.Router();

// Store visitor data in memory (in production, use a database)
let visitors = [];
let visitorStats = {
  totalVisits: 0,
  uniqueVisitors: 0,
  todayVisits: 0,
  last24Hours: 0
};

// Middleware to track visitors
const trackVisitor = (req, res, next) => {
  const visitorData = {
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    url: req.originalUrl,
    method: req.method,
    referer: req.get('Referer'),
    userId: req.user ? req.user.id : null,
    userRole: req.user ? req.user.role : 'anonymous'
  };

  visitors.push(visitorData);
  
  // Keep only last 1000 visitors to prevent memory issues
  if (visitors.length > 1000) {
    visitors = visitors.slice(-1000);
  }

  // Update stats
  visitorStats.totalVisits++;
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  visitorStats.todayVisits = visitors.filter(v => new Date(v.timestamp) >= today).length;
  visitorStats.last24Hours = visitors.filter(v => new Date(v.timestamp) >= last24Hours).length;
  
  // Count unique visitors (by IP)
  const uniqueIPs = new Set(visitors.map(v => v.ip));
  visitorStats.uniqueVisitors = uniqueIPs.size;

  next();
};

// Apply visitor tracking to all routes
router.use(trackVisitor);

// Get error logs - Super Admin only
router.get('/error-logs', auth, checkRole(['admin']), asyncHandler(async (req, res) => {
  try {
    const logsDir = path.join(__dirname, '../logs');
    
    if (!fs.existsSync(logsDir)) {
      return res.json({ 
        errorLogs: [],
        exceptionLogs: [],
        rejectionLogs: [],
        message: 'No logs directory found'
      });
    }

    const parseLogFile = (filename, sourceType) => {
      const filePath = path.join(logsDir, filename);
      if (!fs.existsSync(filePath)) {
        return [];
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const parsed = [];
      let currentEntry = null;

      const flushCurrentEntry = () => {
        if (!currentEntry) return;

        const details = currentEntry.details.join('\n').trim();
        let stack = null;
        let meta = null;

        if (details) {
          const stackMatch = details.match(/Stack:\s*([\s\S]*?)(\nMeta:|$)/);
          if (stackMatch && stackMatch[1]) {
            stack = stackMatch[1].trim();
          }

          const metaMatch = details.match(/Meta:\s*([\s\S]*)$/);
          if (metaMatch && metaMatch[1]) {
            try {
              meta = JSON.parse(metaMatch[1].trim());
            } catch (e) {
              meta = { raw: metaMatch[1].trim() };
            }
          }
        }

        parsed.push({
          timestamp: currentEntry.timestamp,
          level: (currentEntry.level || 'error').toLowerCase(),
          message: currentEntry.message || 'No message available',
          stack,
          meta,
          raw: details,
          source: sourceType,
          file: filename
        });
      };

      for (const lineRaw of lines) {
        const line = lineRaw || '';
        const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\s+\[(\w+)\]:\s*(.*)$/);

        if (timestampMatch) {
          flushCurrentEntry();
          currentEntry = {
            timestamp: timestampMatch[1],
            level: timestampMatch[2],
            message: timestampMatch[3],
            details: []
          };
        } else if (currentEntry && line.trim()) {
          currentEntry.details.push(line);
        }
      }

      flushCurrentEntry();
      return parsed;
    };

    const logFiles = fs.readdirSync(logsDir)
      .filter(file => file.endsWith('.log'))
      .sort((a, b) => {
        const aPath = path.join(logsDir, a);
        const bPath = path.join(logsDir, b);
        return fs.statSync(bPath).mtimeMs - fs.statSync(aPath).mtimeMs;
      });

    const errorFiles = logFiles.filter(file => file.startsWith('error-'));
    const exceptionFiles = logFiles.filter(file => file.startsWith('exceptions-'));
    const rejectionFiles = logFiles.filter(file => file.startsWith('rejections-'));

    const errorLogs = errorFiles.flatMap(file => parseLogFile(file, 'application'));
    const exceptionLogs = exceptionFiles.flatMap(file => parseLogFile(file, 'exception'));
    const rejectionLogs = rejectionFiles.flatMap(file => parseLogFile(file, 'rejection'));

    const combinedLogs = [...errorLogs, ...exceptionLogs, ...rejectionLogs]
      .sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, 300);

    res.json({
      errorLogs,
      exceptionLogs,
      rejectionLogs,
      combinedLogs,
      totalErrors: errorLogs.length + exceptionLogs.length + rejectionLogs.length
    });

  } catch (error) {
    logError('Failed to fetch error logs', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: 'Failed to fetch error logs' });
  }
}));

// Get visitor statistics - Super Admin only
router.get('/visitor-stats', auth, checkRole(['admin']), asyncHandler(async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get recent visitors (last 100)
    const recentVisitors = visitors
      .slice(-100)
      .reverse()
      .map(visitor => ({
        ...visitor,
        timestamp: new Date(visitor.timestamp).toLocaleString()
      }));

    // Get hourly stats for today
    const hourlyStats = [];
    for (let i = 0; i < 24; i++) {
      const hourStart = new Date(today.getTime() + i * 60 * 60 * 1000);
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
      
      const hourVisits = visitors.filter(v => {
        const visitTime = new Date(v.timestamp);
        return visitTime >= hourStart && visitTime < hourEnd;
      }).length;

      hourlyStats.push({
        hour: i,
        visits: hourVisits
      });
    }

    // Get daily stats for last 7 days
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const dayVisits = visitors.filter(v => {
        const visitTime = new Date(v.timestamp);
        return visitTime >= dayStart && visitTime < dayEnd;
      }).length;

      dailyStats.push({
        date: dayStart.toISOString().split('T')[0],
        visits: dayVisits
      });
    }

    // Get top pages
    const pageStats = {};
    visitors.forEach(visitor => {
      const page = visitor.url.split('?')[0]; // Remove query parameters
      pageStats[page] = (pageStats[page] || 0) + 1;
    });

    const topPages = Object.entries(pageStats)
      .map(([page, visits]) => ({ page, visits }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 10);

    // Get user role distribution
    const roleStats = {};
    visitors.forEach(visitor => {
      const role = visitor.userRole || 'anonymous';
      roleStats[role] = (roleStats[role] || 0) + 1;
    });

    res.json({
      stats: {
        totalVisits: visitorStats.totalVisits,
        uniqueVisitors: visitorStats.uniqueVisitors,
        todayVisits: visitorStats.todayVisits,
        last24Hours: visitorStats.last24Hours,
        last7Days: visitors.filter(v => new Date(v.timestamp) >= last7Days).length
      },
      recentVisitors,
      hourlyStats,
      dailyStats,
      topPages,
      roleStats
    });

  } catch (error) {
    logError('Failed to fetch visitor stats', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: 'Failed to fetch visitor statistics' });
  }
}));

// Clear visitor data - Super Admin only
router.delete('/visitor-data', auth, checkRole(['admin']), asyncHandler(async (req, res) => {
  try {
    visitors = [];
    visitorStats = {
      totalVisits: 0,
      uniqueVisitors: 0,
      todayVisits: 0,
      last24Hours: 0
    };

    res.json({ message: 'Visitor data cleared successfully' });
  } catch (error) {
    logError('Failed to clear visitor data', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: 'Failed to clear visitor data' });
  }
}));

module.exports = router;
