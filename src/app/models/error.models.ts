/**
 * Custom error interfaces for the coffee app
 */

export interface LoginError {
  type: 'authentication' | 'network' | 'server' | 'parsing';
  message: string;
  details?: string;
  timestamp: Date;
}

export interface ApiError {
  type: 'network' | 'server' | 'timeout' | 'unknown';
  message: string;
  statusCode?: number;
  details?: string;
  timestamp: Date;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Factory functions for creating typed errors
 * 
 * Provides consistent error creation with automatic timestamping.
 * Use these factory methods instead of creating error objects directly
 * to ensure proper typing and consistent structure.
 * 
 * @example
 * ```typescript
 * // Create a login error
 * const error = ErrorFactory.createLoginError(
 *   'authentication', 
 *   'Invalid username or password',
 *   'User not found in database'
 * );
 * 
 * // Create an API error
 * const apiError = ErrorFactory.createApiError(
 *   'network',
 *   'Failed to connect to server',
 *   500,
 *   'Connection timeout after 30 seconds'
 * );
 * ```
 */
export class ErrorFactory {
  static createLoginError(
    type: LoginError['type'], 
    message: string, 
    details?: string
  ): LoginError {
    return {
      type,
      message,
      details,
      timestamp: new Date()
    };
  }

  static createApiError(
    type: ApiError['type'], 
    message: string, 
    statusCode?: number, 
    details?: string
  ): ApiError {
    return {
      type,
      message,
      statusCode,
      details,
      timestamp: new Date()
    };
  }
}
