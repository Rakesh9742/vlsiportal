#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const logsDir = path.join(__dirname, '../logs');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function colorize(level, message) {
  switch (level.toLowerCase()) {
    case 'error':
      return `${colors.red}${message}${colors.reset}`;
    case 'warn':
      return `${colors.yellow}${message}${colors.reset}`;
    case 'info':
      return `${colors.blue}${message}${colors.reset}`;
    case 'debug':
      return `${colors.cyan}${message}${colors.reset}`;
    default:
      return message;
  }
}

function listLogFiles() {
  if (!fs.existsSync(logsDir)) {
    console.log('No logs directory found. Start the server to generate logs.');
    return [];
  }

  const files = fs.readdirSync(logsDir)
    .filter(file => file.endsWith('.log'))
    .sort()
    .reverse(); // Most recent first

  return files;
}

function displayLogFile(filename, lines = 50) {
  const filePath = path.join(logsDir, filename);
  
  if (!fs.existsSync(filePath)) {
    console.log(`Log file ${filename} not found.`);
    return;
  }

  console.log(`\n${colors.magenta}=== ${filename} (last ${lines} lines) ===${colors.reset}\n`);

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const allLines = fileContent.split('\n').filter(line => line.trim());
  const recentLines = allLines.slice(-lines);

  recentLines.forEach(line => {
    try {
      // Try to parse as JSON log entry
      const logEntry = JSON.parse(line);
      const timestamp = logEntry.timestamp || '';
      const level = logEntry.level || 'info';
      const message = logEntry.message || '';
      
      console.log(`${colors.green}${timestamp}${colors.reset} ${colorize(level, `[${level.toUpperCase()}]`)} ${message}`);
      
      if (logEntry.stack) {
        console.log(`${colors.red}Stack: ${logEntry.stack}${colors.reset}`);
      }
      
      if (logEntry.meta && Object.keys(logEntry.meta).length > 0) {
        console.log(`${colors.cyan}Meta: ${JSON.stringify(logEntry.meta, null, 2)}${colors.reset}`);
      }
    } catch (e) {
      // If not JSON, display as plain text
      console.log(line);
    }
  });
}

function showHelp() {
  console.log(`
${colors.cyan}VLSI Portal Log Viewer${colors.reset}

Usage:
  node view-logs.js [command] [options]

Commands:
  list                    List all available log files
  view [filename]         View a specific log file (default: 50 lines)
  view [filename] [lines] View a specific log file with custom line count
  errors                  Show only error logs
  recent                  Show recent logs from all files
  help                    Show this help message

Examples:
  node view-logs.js list
  node view-logs.js view error-2024-01-15.log
  node view-logs.js view combined-2024-01-15.log 100
  node view-logs.js errors
  node view-logs.js recent

Log Files:
  - error-YYYY-MM-DD.log     Only error level logs
  - combined-YYYY-MM-DD.log  All log levels
  - app-YYYY-MM-DD.log       Info level and above
  - exceptions-YYYY-MM-DD.log Uncaught exceptions
  - rejections-YYYY-MM-DD.log Unhandled promise rejections
`);
}

function showErrors() {
  const files = listLogFiles();
  const errorFiles = files.filter(file => file.startsWith('error-') || file.startsWith('exceptions-') || file.startsWith('rejections-'));
  
  if (errorFiles.length === 0) {
    console.log('No error log files found.');
    return;
  }

  console.log(`${colors.red}=== ERROR LOGS ===${colors.reset}\n`);
  
  errorFiles.forEach(file => {
    displayLogFile(file, 20);
  });
}

function showRecent() {
  const files = listLogFiles();
  
  if (files.length === 0) {
    console.log('No log files found.');
    return;
  }

  console.log(`${colors.blue}=== RECENT LOGS ===${colors.reset}\n`);
  
  // Show recent logs from the most recent file
  const mostRecentFile = files[0];
  displayLogFile(mostRecentFile, 30);
}

// Main execution
const args = process.argv.slice(2);
const command = args[0] || 'help';

switch (command) {
  case 'list':
    const files = listLogFiles();
    if (files.length === 0) {
      console.log('No log files found.');
    } else {
      console.log('Available log files:');
      files.forEach(file => {
        const filePath = path.join(logsDir, file);
        const stats = fs.statSync(filePath);
        const size = (stats.size / 1024).toFixed(2);
        console.log(`  ${file} (${size} KB)`);
      });
    }
    break;
    
  case 'view':
    const filename = args[1];
    const lines = parseInt(args[2]) || 50;
    
    if (!filename) {
      console.log('Please specify a filename. Use "list" to see available files.');
    } else {
      displayLogFile(filename, lines);
    }
    break;
    
  case 'errors':
    showErrors();
    break;
    
  case 'recent':
    showRecent();
    break;
    
  case 'help':
  default:
    showHelp();
    break;
}
