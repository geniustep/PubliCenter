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
   * Check if log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    // Filter logs based on log level
    if (!this.shouldLog(level)) {
      return;
    }

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

    // In production, send to Sentry
    if (process.env.NODE_ENV === 'production' && level === 'error') {
      this.sendToSentry(message, context);
    }
  }

  /**
   * Send error to Sentry
   */
  private async sendToSentry(message: string, context?: Record<string, any>): Promise<void> {
    try {
      // Dynamic import to avoid bundling Sentry in development
      const Sentry = await import('@sentry/nextjs');

      const error = new Error(message);
      Sentry.captureException(error, {
        extra: context,
        level: 'error',
      });
    } catch (error) {
      // Silently fail if Sentry is not available
      console.error('Failed to send error to Sentry:', error);
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
