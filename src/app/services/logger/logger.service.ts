import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

/**
 * Structured log entry interface
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  data?: any;
  requestId?: string;
  userId?: string;
  sessionId?: string;
}

/**
 * Enhanced logging service with structured logging and different log levels
 * 
 * Provides centralized, structured logging with different severity levels,
 * request correlation, and environment-aware output formatting.
 * 
 * @example
 * ```typescript
 * // Inject the service
 * constructor(private logger: LoggerService) {}
 * 
 * // Log different levels
 * this.logger.debug('Debug information', { someData: 'value' });
 * this.logger.info('Operation completed successfully');
 * this.logger.warn('Something unusual happened', { warning: 'details' });
 * this.logger.error('An error occurred', error);
 * this.logger.critical('System failure', { criticalError: error });
 * 
 * // Log with context
 * this.logger.setContext('AuthService');
 * this.logger.info('User logged in', { username: 'john_doe' });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private currentContext?: string;
  private sessionId: string;
  private currentLogLevel: LogLevel;
  
  constructor() {
    this.sessionId = this.generateSessionId();
    this.currentLogLevel = this.getEnvironmentLogLevel();
  }

  /**
   * Set the current context for subsequent log entries
   */
  setContext(context: string): void {
    this.currentContext = context;
  }

  /**
   * Clear the current context
   */
  clearContext(): void {
    this.currentContext = undefined;
  }

  /**
   * Log debug information (development only)
   */
  debug(message: string, data?: any, requestId?: string): void {
    this.log(LogLevel.DEBUG, message, data, requestId);
  }

  /**
   * Log informational messages
   */
  info(message: string, data?: any, requestId?: string): void {
    this.log(LogLevel.INFO, message, data, requestId);
  }

  /**
   * Log warning messages
   */
  warn(message: string, data?: any, requestId?: string): void {
    this.log(LogLevel.WARN, message, data, requestId);
  }

  /**
   * Log error messages
   */
  error(message: string, data?: any, requestId?: string): void {
    this.log(LogLevel.ERROR, message, data, requestId);
  }

  /**
   * Log critical system failures
   */
  critical(message: string, data?: any, requestId?: string): void {
    this.log(LogLevel.CRITICAL, message, data, requestId);
  }

  /**
   * Log HTTP requests and responses
   */
  logHttpRequest(method: string, url: string, requestId: string, data?: any): void {
    this.log(LogLevel.DEBUG, `🌐 HTTP ${method} ${url}`, {
      method,
      url,
      requestData: data,
      type: 'http_request'
    }, requestId);
  }

  /**
   * Log HTTP responses
   */
  logHttpResponse(
    method: string, 
    url: string, 
    status: number, 
    duration: number, 
    requestId: string, 
    data?: any
  ): void {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.DEBUG;
    const emoji = status >= 400 ? '❌' : '✅';
    
    this.log(level, `${emoji} HTTP ${method} ${url} - ${status} (${duration}ms)`, {
      method,
      url,
      status,
      duration,
      responseData: data,
      type: 'http_response'
    }, requestId);
  }

  /**
   * Log authentication events
   */
  logAuthEvent(event: string, data?: any, requestId?: string): void {
    this.log(LogLevel.INFO, `🔐 Auth: ${event}`, {
      ...data,
      type: 'auth_event'
    }, requestId);
  }

  /**
   * Log user actions
   */
  logUserAction(action: string, data?: any, userId?: string): void {
    this.log(LogLevel.INFO, `👤 User: ${action}`, {
      ...data,
      userId,
      type: 'user_action'
    });
  }

  /**
   * Log performance metrics
   */
  logPerformance(operation: string, duration: number, data?: any): void {
    const level = duration > 5000 ? LogLevel.WARN : LogLevel.DEBUG;
    
    this.log(level, `⏱️ Performance: ${operation} took ${duration}ms`, {
      operation,
      duration,
      ...data,
      type: 'performance'
    });
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, data?: any, requestId?: string): void {
    // Check if this log level should be output
    if (level < this.currentLogLevel) {
      return;
    }

    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context: this.currentContext,
      data,
      requestId,
      sessionId: this.sessionId
    };

    // Format and output the log
    this.outputLog(logEntry);

    // In production, you might also send logs to a remote service
    if (environment.production && level >= LogLevel.ERROR) {
      this.sendToRemoteLogger(logEntry);
    }
  }

  /**
   * Output log entry to console with appropriate formatting
   */
  private outputLog(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const levelName = LogLevel[entry.level];
    const context = entry.context ? `[${entry.context}]` : '';
    const requestId = entry.requestId ? `[${entry.requestId}]` : '';
    
    const logPrefix = `${timestamp} ${levelName} ${context}${requestId}`.trim();

    // Choose console method and styling based on log level
    switch (entry.level) {
      case LogLevel.DEBUG:
        if (environment.logging?.enableConsoleLogging && environment.logging?.logLevel === 'debug') {
          console.debug(`🔍 ${logPrefix}`, entry.message, entry.data || '');
        }
        break;
        
      case LogLevel.INFO:
        if (environment.logging?.enableConsoleLogging) {
          console.info(`ℹ️ ${logPrefix}`, entry.message, entry.data || '');
        }
        break;
        
      case LogLevel.WARN:
        console.warn(`⚠️ ${logPrefix}`, entry.message, entry.data || '');
        break;
        
      case LogLevel.ERROR:
        console.error(`🚨 ${logPrefix}`, entry.message, entry.data || '');
        break;
        
      case LogLevel.CRITICAL:
        console.error(`💥 ${logPrefix}`, entry.message, entry.data || '');
        // Could also trigger alerts or notifications
        break;
    }
  }

  /**
   * Get log level from environment configuration
   */
  private getEnvironmentLogLevel(): LogLevel {
    if (!environment.logging?.enableConsoleLogging) {
      return LogLevel.ERROR; // Only show errors if logging is disabled
    }

    switch (environment.logging?.logLevel) {
      case 'debug': return LogLevel.DEBUG;
      case 'info': return LogLevel.INFO;
      case 'warn': return LogLevel.WARN;
      case 'error': return LogLevel.ERROR;
      default: return environment.production ? LogLevel.WARN : LogLevel.DEBUG;
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Send critical logs to remote logging service (placeholder)
   */
  private sendToRemoteLogger(entry: LogEntry): void {
    // In a real application, you would send logs to a service like:
    // - Azure Application Insights
    // - AWS CloudWatch
    // - Datadog
    // - Custom logging API
    
    // For now, just store in localStorage as a fallback
    try {
      const storedLogs = JSON.parse(localStorage.getItem('coffee_app_logs') || '[]');
      storedLogs.push(entry);
      
      // Keep only the last 100 log entries
      if (storedLogs.length > 100) {
        storedLogs.splice(0, storedLogs.length - 100);
      }
      
      localStorage.setItem('coffee_app_logs', JSON.stringify(storedLogs));
    } catch (error) {
      console.error('Failed to store log entry:', error);
    }
  }

  /**
   * Get stored logs (for debugging or support)
   */
  getStoredLogs(): LogEntry[] {
    try {
      return JSON.parse(localStorage.getItem('coffee_app_logs') || '[]');
    } catch (error) {
      console.error('Failed to retrieve stored logs:', error);
      return [];
    }
  }

  /**
   * Clear stored logs
   */
  clearStoredLogs(): void {
    localStorage.removeItem('coffee_app_logs');
  }
}
