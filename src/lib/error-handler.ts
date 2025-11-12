import { NextResponse } from 'next/server';
import { logger } from './logger';

/**
 * Custom application error
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  constructor(message: string, public errors?: Record<string, string[]>) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict error
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', public retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

/**
 * External service error
 */
export class ExternalServiceError extends AppError {
  constructor(message: string, public service?: string) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR');
    this.name = 'ExternalServiceError';
  }
}

/**
 * Handle error and return appropriate response
 */
export function handleError(error: unknown): NextResponse {
  // Log error
  logger.error('API Error', {
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
  });

  // Handle known error types
  if (error instanceof AppError) {
    const response: any = {
      success: false,
      error: error.message,
      code: error.code,
    };

    // Add validation errors if available
    if (error instanceof ValidationError && error.errors) {
      response.errors = error.errors;
    }

    // Add retry-after header for rate limit errors
    const headers: Record<string, string> = {};
    if (error instanceof RateLimitError && error.retryAfter) {
      headers['Retry-After'] = String(error.retryAfter);
    }

    return NextResponse.json(response, {
      status: error.statusCode,
      headers,
    });
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as any;

    switch (prismaError.code) {
      case 'P2002':
        return NextResponse.json(
          {
            success: false,
            error: 'A record with this value already exists',
            code: 'DUPLICATE_ENTRY',
          },
          { status: 409 }
        );

      case 'P2025':
        return NextResponse.json(
          {
            success: false,
            error: 'Record not found',
            code: 'NOT_FOUND',
          },
          { status: 404 }
        );

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Database error occurred',
            code: 'DATABASE_ERROR',
          },
          { status: 500 }
        );
    }
  }

  // Handle generic errors
  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false,
        error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
        code: 'INTERNAL_SERVER_ERROR',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
      },
      { status: 500 }
    );
  }

  // Handle unknown errors
  return NextResponse.json(
    {
      success: false,
      error: 'An unknown error occurred',
      code: 'UNKNOWN_ERROR',
    },
    { status: 500 }
  );
}

/**
 * Async error handler wrapper for API routes
 */
export function asyncHandler<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleError(error);
    }
  };
}
