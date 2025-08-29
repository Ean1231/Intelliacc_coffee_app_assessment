import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { LoggerService } from '../services/logger/logger.service';

/**
 * HTTP interceptor for logging requests and responses
 * 
 * Logs HTTP traffic in development mode and errors in production.
 * Provides structured logging with request IDs, timing, and error details.
 * 
 * @example
 * ```typescript
 * // Add to app.config.ts providers
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideHttpClient(
 *       withInterceptors([loggingInterceptor])
 *     )
 *   ]
 * };
 * ```
 */
export const loggingInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>, 
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  
  const logger = inject(LoggerService);
  logger.setContext('HttpInterceptor');
  
  const startTime = Date.now();
  const requestId = req.headers.get('X-Request-ID') || generateRequestId();
  
  // Clone request to add request ID if not present
  const reqWithId = req.headers.has('X-Request-ID') 
    ? req 
    : req.clone({
        setHeaders: { 'X-Request-ID': requestId }
      });

  // Log request
  logger.logHttpRequest(req.method, req.url, requestId, {
    headers: req.headers.keys().reduce((acc, key) => {
      acc[key] = req.headers.get(key);
      return acc;
    }, {} as Record<string, string | null>),
    body: req.body
  });

  return next(reqWithId).pipe(
    tap({
      next: (event) => {
        if (event.type === 4) { // HttpEventType.Response
          const duration = Date.now() - startTime;
          const response = event as any;
          
          logger.logHttpResponse(
            req.method, 
            req.url, 
            response.status, 
            duration, 
            requestId, 
            response.body
          );
        }
      }
    }),
    catchError((error) => {
      const duration = Date.now() - startTime;
      
      logger.error(`HTTP ${req.method} ${req.url} failed after ${duration}ms`, {
        status: error.status,
        statusText: error.statusText,
        message: error.message,
        url: error.url,
        duration,
        type: 'http_error'
      }, requestId);
      
      throw error;
    })
  );
};

/**
 * Generate a unique request ID for tracking
 */
function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
