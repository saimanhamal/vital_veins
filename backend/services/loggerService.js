/**
 * Logging Service
 * Centralized logging for errors, security events, and activity tracking
 */

const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

class Logger {
  /**
   * Get Timestamp
   */
  static getTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Get Log File Path
   */
  static getLogFilePath(type) {
    const fileName = `${type}-${new Date().toISOString().split('T')[0]}.log`;
    return path.join(logsDir, fileName);
  }

  /**
   * Write to Log File
   */
  static writeToFile(filePath, message) {
    try {
      fs.appendFileSync(filePath, `${message}\n`, 'utf8');
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }

  /**
   * Log Error
   */
  static error(message, error = null, context = {}) {
    const logMessage = JSON.stringify({
      timestamp: this.getTimestamp(),
      level: 'ERROR',
      message,
      error: error ? {
        message: error.message,
        stack: error.stack
      } : null,
      context
    });

    console.error('❌', message, error?.message);
    this.writeToFile(this.getLogFilePath('error'), logMessage);
  }

  /**
   * Log Warning
   */
  static warn(message, context = {}) {
    const logMessage = JSON.stringify({
      timestamp: this.getTimestamp(),
      level: 'WARN',
      message,
      context
    });

    console.warn('⚠️ ', message);
    this.writeToFile(this.getLogFilePath('warning'), logMessage);
  }

  /**
   * Log Info
   */
  static info(message, context = {}) {
    const logMessage = JSON.stringify({
      timestamp: this.getTimestamp(),
      level: 'INFO',
      message,
      context
    });

    console.log('ℹ️ ', message);
    this.writeToFile(this.getLogFilePath('info'), logMessage);
  }

  /**
   * Log Security Event
   */
  static security(event, details = {}) {
    const logMessage = JSON.stringify({
      timestamp: this.getTimestamp(),
      level: 'SECURITY',
      event,
      details
    });

    console.log('🔒 [SECURITY]', event);
    this.writeToFile(this.getLogFilePath('security'), logMessage);
  }

  /**
   * Log Failed Login Attempt
   */
  static failedLogin(email, ip, reason) {
    this.security('FAILED_LOGIN_ATTEMPT', {
      email,
      ip,
      reason,
      timestamp: this.getTimestamp()
    });
  }

  /**
   * Log Successful Login
   */
  static successfulLogin(userId, email, ip) {
    this.security('SUCCESSFUL_LOGIN', {
      userId,
      email,
      ip,
      timestamp: this.getTimestamp()
    });
  }

  /**
   * Log Unauthorized Access Attempt
   */
  static unauthorizedAccess(userId, resource, ip) {
    this.security('UNAUTHORIZED_ACCESS_ATTEMPT', {
      userId,
      resource,
      ip,
      timestamp: this.getTimestamp()
    });
  }

  /**
   * Log Data Modification
   */
  static dataModification(userId, entity, action, details) {
    this.security('DATA_MODIFICATION', {
      userId,
      entity,
      action,
      details,
      timestamp: this.getTimestamp()
    });
  }

  /**
   * Log Rate Limit Exceeded
   */
  static rateLimitExceeded(ip, endpoint, limit) {
    this.security('RATE_LIMIT_EXCEEDED', {
      ip,
      endpoint,
      limit,
      timestamp: this.getTimestamp()
    });
  }

  /**
   * Log API Call (for debugging in development)
   */
  static apiCall(method, path, statusCode, responseTime, userId = null) {
    if (process.env.NODE_ENV === 'development') {
      const logMessage = JSON.stringify({
        timestamp: this.getTimestamp(),
        method,
        path,
        statusCode,
        responseTime: `${responseTime}ms`,
        userId
      });

      this.writeToFile(this.getLogFilePath('api'), logMessage);
    }
  }

  /**
   * Get Recent Logs
   */
  static getRecentLogs(type, lines = 50) {
    try {
      const filePath = this.getLogFilePath(type);
      if (!fs.existsSync(filePath)) return [];

      const content = fs.readFileSync(filePath, 'utf8');
      return content.split('\n').slice(-lines).filter(line => line.trim());
    } catch (error) {
      console.error('Error reading logs:', error);
      return [];
    }
  }
}

module.exports = Logger;
