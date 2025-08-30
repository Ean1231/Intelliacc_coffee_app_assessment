import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, from } from 'rxjs';
import { map, catchError, tap, finalize, switchMap } from 'rxjs/operators';
import { UiStateService } from '../ui-state/ui-state.service';
import { ErrorFactory } from '../../models/error.models';
import { SOAP_CONFIG } from '../../config/soap.config';
import { LoggerService } from '../logger/logger.service';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly endpoint = environment.soapEndpoint;
  private readonly loggedIn$ = new BehaviorSubject<boolean>(this.getFromStorage());

  constructor(
    private http: HttpClient,
    private uiState: UiStateService,
    private logger: LoggerService
  ) {
    this.logger.setContext('AuthService');
  }

  /**
   * Synchronously check if user is logged in
   * @returns true if user is authenticated, false otherwise
   */
  get isLoggedInSync(): boolean {
    return this.loggedIn$.value;
  }

  /**
   * Get authentication status as observable
   * @returns Observable boolean indicating authentication status
   */
  get isLoggedIn$(): Observable<boolean> {
    return this.loggedIn$.asObservable();
  }

  /**
   * Authenticate user with username and password
   * @param username - User's username
   * @param password - User's password
   * @returns Observable boolean indicating success/failure
   */
  login(username: string, password: string): Observable<boolean> {
    this.logger.logAuthEvent('Login attempt started', { username });
    
    // Clear any existing errors and start loading
    this.uiState.clearErrors();
    this.uiState.startLoading('Authenticating...');

    const soap = SOAP_CONFIG.TEMPLATES.LOGIN
      .replace(SOAP_CONFIG.PLACEHOLDERS.USERNAME, username)
      .replace(SOAP_CONFIG.PLACEHOLDERS.PASSWORD, password);

    const headers = new HttpHeaders({
      ...SOAP_CONFIG.HEADERS,
      'X-Handle-Own-Errors': 'true' // Auth service handles its own errors
    });

    const isNative = Capacitor.isNativePlatform();
    const request$ = isNative
      ? from(CapacitorHttp.post({
          url: this.endpoint,
          headers: SOAP_CONFIG.HEADERS as any,
          data: soap,
          responseType: 'text'
        })).pipe(map((res: any) => String(res.data)))
      : this.http.post(this.endpoint, soap, { headers, responseType: 'text' });

    return request$.pipe(
      map(xml => this.parseLoginResponse(xml)),
      tap(success => {
        this.updateAuthState(success);
        if (success) {
          this.logger.logAuthEvent('Login successful', { username });
        } else {
          this.logger.logAuthEvent('Login failed - invalid credentials', { username });
          // Add authentication error if login failed
          const error = ErrorFactory.createLoginError(
            'authentication',
            'Invalid username or password. Please try again.',
            'Authentication failed'
          );
          this.uiState.addError(error);
        }
      }),
      catchError(err => this.handleLoginError(err, username)),
      finalize(() => this.uiState.stopLoading())
    );
  }

  /**
   * Log out the current user
   */
  logout(): void {
    this.logger.logAuthEvent('Logout initiated');
    this.updateAuthState(false);
    this.logger.logAuthEvent('Logout completed');
  }

  /**
   * Parse SOAP login response
   * @param xml - SOAP response XML string
   * @returns boolean indicating login success
   */
  private parseLoginResponse(xml: string): boolean {
    try {
      const doc = new DOMParser().parseFromString(xml, 'text/xml');
      const node = doc.getElementsByTagNameNS(SOAP_CONFIG.NAMESPACE, 'LoginResult')[0]
        || doc.getElementsByTagName('LoginResult')[0];
      const result = (node?.textContent || '').trim().toLowerCase() === 'true';
      
      this.logger.debug('SOAP response parsed', { 
        hasNode: !!node, 
        nodeContent: node?.textContent, 
        result 
      });
      
      return result;
    } catch (error) {
      this.logger.error('Error parsing login response', error);
      return false;
    }
  }

  /**
   * Handle login errors
   * @param error - The error that occurred
   * @returns Observable of false
   */
  private handleLoginError(error: any, username?: string): Observable<boolean> {
    this.logger.error('Login error occurred', { 
      error, 
      username,
      status: error.status,
      statusText: error.statusText 
    });
    
    this.updateAuthState(false);
    
    // Create appropriate error based on error type
    let loginError;
    if (error.status === 0) {
      this.logger.logAuthEvent('Login failed - network error', { username, errorType: 'network' });
      loginError = ErrorFactory.createLoginError(
        'network',
        'Unable to connect to the server. Please check your connection.',
        'Network error'
      );
    } else if (error.status >= 500) {
      this.logger.logAuthEvent('Login failed - server error', { username, errorType: 'server', status: error.status });
      loginError = ErrorFactory.createLoginError(
        'server',
        'Server error occurred. Please try again later.',
        `Server returned ${error.status}`
      );
    } else {
      this.logger.logAuthEvent('Login failed - unknown error', { username, errorType: 'unknown', error: error.message });
      loginError = ErrorFactory.createLoginError(
        'network',
        'Login failed due to a connection error. Please try again.',
        error.message || 'Unknown error'
      );
    }
    
    this.uiState.addError(loginError);
    return of(false);
  }

  /**
   * Update authentication state
   * @param isAuthenticated - New authentication status
   */
  private updateAuthState(isAuthenticated: boolean): void {
    this.setStorage(isAuthenticated);
    this.loggedIn$.next(isAuthenticated);
  }

  /**
   * Store authentication status in localStorage
   * @param value - Authentication status to store
   */
  private setStorage(value: boolean): void {
    localStorage.setItem(SOAP_CONFIG.STORAGE.LOGIN_KEY, value ? '1' : '0');
  }

  /**
   * Retrieve authentication status from localStorage
   * @returns Stored authentication status
   */
  private getFromStorage(): boolean {
    return localStorage.getItem(SOAP_CONFIG.STORAGE.LOGIN_KEY) === '1';
  }
}
