type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
}

/**
 * Simple logger implementation
 */
class Logger {
  private logLevel: LogLevel;

  constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    // Console output with emoji
    const emoji = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      debug: '🔍',
    };

    const formattedMessage = `${emoji[level]} [${entry.timestamp}] ${message}`;

    if (context) {
      console.log(formattedMessage, context);
    } else {
      console.log(formattedMessage);
    }

    // In production, send to external service (Sentry, LogDNA, etc.)
    if (process.env.NODE_ENV === 'production' && level === 'error') {
      // TODO: Send to error tracking service
      // Example: Sentry.captureException(new Error(message), { extra: context });
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  /**
   * Log error message
   */
  error(message: string, context?: Record<string, any>): void {
    this.log('error', message, context);
  }

  /**
   * Log debug message (only in development)
   */
  debug(message: string, context?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, context);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for testing
export { Logger };
