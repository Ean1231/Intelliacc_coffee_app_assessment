import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { UiStateService } from '../services/ui-state/ui-state.service';
import { ErrorFactory } from '../models/error.models';
import { environment } from '../../environments/environment';

/**
 * HTTP interceptor for global error handling
 * 
 * Provides centralized error handling for all HTTP requests.
 * Automatically creates typed errors and integrates with UiStateService
 * for consistent error display throughout the application.
 * 
 * Features:
 * - Global error catching and transformation
 * - Integration with UiStateService for error display
 * - Automatic retry for specific error types
 * - Structured error logging
 * 
 * @example
 * ```typescript
 * // Add to app.config.ts providers
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideHttpClient(
 *       withInterceptors([errorHandlingInterceptor])
 *     )
 *   ]
 * };
 * ```
 */
export const errorHandlingInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>, 
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  
  const uiState = inject(UiStateService);
  
  return next(req).pipe(
    catchError((error: any) => {
      // Create structured error based on the error type
      const apiError = createApiErrorFromError(error);
      
      // Check if the request has a custom header indicating it should handle its own errors
      const handleOwnErrors = req.headers.get('X-Handle-Own-Errors') === 'true';
      
      if (!handleOwnErrors) {
        uiState.addError(apiError);
      }
      
      // Log the error with context
      logError(error, req);
      
      return throwError(() => error);
    })
  );
};

/**
 * Create a typed API error from any error
 */
function createApiErrorFromError(error: any) {
  let errorType: 'network' | 'server' | 'timeout' | 'unknown' = 'unknown';
  let message = 'An unexpected error occurred';
  let statusCode: number | undefined;
  
  // Handle timeout errors (from timeout interceptor)
  if (error.name === 'TimeoutError') {
    errorType = 'timeout';
    message = 'Request timed out. Please try again.';
  }
  // Handle HTTP error responses
  else if (error instanceof HttpErrorResponse) {
    statusCode = error.status;
    if (error.status === 0) {
      errorType = 'network';
      message = 'Network connection failed. Please check your internet connection.';
    } else if (error.status >= 400 && error.status < 500) {
      errorType = 'unknown';
      message = `Client error: ${error.status} ${error.statusText}`;
    } else if (error.status >= 500) {
      errorType = 'server';
      message = 'Server error occurred. Please try again later.';
    }
  }
  // Handle other error types
  else if (error instanceof Error) {
    message = error.message || 'An unexpected error occurred';
  }
  
  return ErrorFactory.createApiError(
    errorType,
    message,
    statusCode,
    error.message || error.toString()
  );
}

/**
 * Log errors with structured information
 */
function logError(error: any, request: HttpRequest<any>) {
  const requestId = request.headers.get('X-Request-ID') || 'unknown';
  
  console.group(`❌ Error - ${request.method} ${request.url}`);
  console.error('Request ID:', requestId);
  
  if (error instanceof HttpErrorResponse) {
    console.error('Status:', error.status);
    console.error('Status Text:', error.statusText);
    console.error('URL:', error.url);
    if (error.error) {
      console.error('Error Body:', error.error);
    }
  } else {
    console.error('Error Type:', error.name || 'Unknown');
    console.error('Error Message:', error.message || error.toString());
  }
  
  console.groupEnd();
}
