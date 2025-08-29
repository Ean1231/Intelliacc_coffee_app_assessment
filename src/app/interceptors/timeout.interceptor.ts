import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

/**
 * HTTP interceptor for request timeout handling
 * 
 * Applies configurable timeouts to HTTP requests based on environment settings.
 * Provides automatic timeout handling with descriptive error messages.
 * 
 * @example
 * ```typescript
 * // Add to app.config.ts providers
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideHttpClient(
 *       withInterceptors([timeoutInterceptor])
 *     )
 *   ]
 * };
 * ```
 */
export const timeoutInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>, 
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  
  // Use custom timeout from headers or default from environment
  const customTimeout = req.headers.get('X-Timeout');
  const timeoutMs = customTimeout 
    ? parseInt(customTimeout, 10) 
    : environment.soap.timeout;
  
  return next(req).pipe(
    timeout(timeoutMs),
    catchError((error) => {
      if (error instanceof TimeoutError) {
        const timeoutError = new Error(`Request timed out after ${timeoutMs}ms`);
        timeoutError.name = 'TimeoutError';
        return throwError(() => timeoutError);
      }
      return throwError(() => error);
    })
  );
};
