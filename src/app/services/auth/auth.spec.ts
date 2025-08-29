import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { UiStateService } from '../ui-state/ui-state.service';
import { environment } from '../../../environments/environment';
import { SOAP_CONFIG } from '../../config/soap.config';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let uiStateServiceSpy: jasmine.SpyObj<UiStateService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('UiStateService', [
      'startLoading', 'stopLoading', 'clearErrors', 'addError'
    ]);
    
    // Configure isLoading as a getter
    Object.defineProperty(spy, 'isLoading', {
      get: jasmine.createSpy('isLoading').and.returnValue(false),
      configurable: true
    });

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: UiStateService, useValue: spy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    uiStateServiceSpy = TestBed.inject(UiStateService) as jasmine.SpyObj<UiStateService>;

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('Constructor and Initial State', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with logged out state when localStorage is empty', () => {
      expect(service.isLoggedInSync).toBeFalse();
    });

    it('should initialize with logged in state when localStorage has login key', () => {
      localStorage.setItem(SOAP_CONFIG.STORAGE.LOGIN_KEY, '1');
      const newService = TestBed.inject(AuthService);
      expect(newService.isLoggedInSync).toBeTrue();
    });
  });

  describe('Authentication Status', () => {
    it('should return current auth status synchronously', () => {
      expect(service.isLoggedInSync).toBeFalse();
      
      // Simulate login
      (service as any).updateAuthState(true);
      expect(service.isLoggedInSync).toBeTrue();
    });

    it('should provide auth status as observable', (done) => {
      service.isLoggedIn$.subscribe(status => {
        expect(status).toBeFalse();
        done();
      });
    });

    it('should emit changes when auth status updates', (done) => {
      let callCount = 0;
      service.isLoggedIn$.subscribe(status => {
        if (callCount === 0) {
          expect(status).toBeFalse();
          callCount++;
          (service as any).updateAuthState(true);
        } else {
          expect(status).toBeTrue();
          done();
        }
      });
    });
  });

  describe('Login', () => {
    const validUsername = 'testuser';
    const validPassword = 'testpass';
    const successXmlResponse = `<?xml version="1.0"?>
      <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
          <LoginResult xmlns="${SOAP_CONFIG.NAMESPACE}">true</LoginResult>
        </soap:Body>
      </soap:Envelope>`;
    const failureXmlResponse = `<?xml version="1.0"?>
      <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
          <LoginResult xmlns="${SOAP_CONFIG.NAMESPACE}">false</LoginResult>
        </soap:Body>
      </soap:Envelope>`;

    it('should make SOAP request with correct parameters', () => {
      service.login(validUsername, validPassword).subscribe();

      const req = httpMock.expectOne(environment.soapEndpoint);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Content-Type')).toBe('text/xml; charset=utf-8');
      expect(req.request.headers.get('SOAPAction')).toBe('http://tempuri.org/Login');
      expect(req.request.headers.has('X-Request-ID')).toBeTrue();
      expect(req.request.body).toContain(`<username>${validUsername}</username>`);
      expect(req.request.body).toContain(`<password>${validPassword}</password>`);

      req.flush(successXmlResponse);
    });

    it('should handle successful login', (done) => {
      service.login(validUsername, validPassword).subscribe(result => {
        expect(result).toBeTrue();
        expect(service.isLoggedInSync).toBeTrue();
        expect(localStorage.getItem(SOAP_CONFIG.STORAGE.LOGIN_KEY)).toBe('1');
        expect(uiStateServiceSpy.startLoading).toHaveBeenCalledWith('Authenticating user...');
        expect(uiStateServiceSpy.stopLoading).toHaveBeenCalled();
        expect(uiStateServiceSpy.clearErrors).toHaveBeenCalled();
        done();
      });

      const req = httpMock.expectOne(environment.soapEndpoint);
      req.flush(successXmlResponse);
    });

    it('should handle failed authentication', (done) => {
      service.login(validUsername, 'wrongpassword').subscribe(result => {
        expect(result).toBeFalse();
        expect(service.isLoggedInSync).toBeFalse();
        expect(localStorage.getItem(SOAP_CONFIG.STORAGE.LOGIN_KEY)).toBe('0');
        expect(uiStateServiceSpy.addError).toHaveBeenCalled();
        done();
      });

      const req = httpMock.expectOne(environment.soapEndpoint);
      req.flush(failureXmlResponse);
    });

    it('should handle network errors with retry logic', (done) => {
      service.login(validUsername, validPassword).subscribe({
        next: () => fail('Should not succeed'),
        error: (error) => {
          expect(service.isLoggedInSync).toBeFalse();
          expect(uiStateServiceSpy.addError).toHaveBeenCalled();
          expect(uiStateServiceSpy.stopLoading).toHaveBeenCalled();
          done();
        }
      });

      // Simulate multiple network failures
      for (let i = 0; i <= SOAP_CONFIG.NETWORK.RETRY_ATTEMPTS; i++) {
        const req = httpMock.expectOne(environment.soapEndpoint);
        req.error(new ProgressEvent('Network error'), { status: 0 });
      }
    });

    it('should handle malformed XML response', (done) => {
      service.login(validUsername, validPassword).subscribe(result => {
        expect(result).toBeFalse();
        expect(uiStateServiceSpy.addError).toHaveBeenCalled();
        done();
      });

      const req = httpMock.expectOne(environment.soapEndpoint);
      req.flush('invalid xml');
    });

    it('should not make request when already loading', () => {
      // Mock the isLoading getter to return true
      Object.defineProperty(uiStateServiceSpy, 'isLoading', {
        get: () => true,
        configurable: true
      });
      
      service.login(validUsername, validPassword).subscribe();
      httpMock.expectNone(environment.soapEndpoint);
    });
  });

  describe('Logout', () => {
    it('should clear authentication state', () => {
      // Set logged in state
      (service as any).updateAuthState(true);
      expect(service.isLoggedInSync).toBeTrue();

      // Logout
      service.logout();
      expect(service.isLoggedInSync).toBeFalse();
      expect(localStorage.getItem(SOAP_CONFIG.STORAGE.LOGIN_KEY)).toBe('0');
    });

    it('should emit logout status to subscribers', (done) => {
      // Set logged in state
      (service as any).updateAuthState(true);
      
      service.isLoggedIn$.subscribe(status => {
        if (!status) {
          done();
        }
      });

      service.logout();
    });
  });

  describe('Storage Management', () => {
    it('should save authentication state to localStorage', () => {
      (service as any).setStorage(true);
      expect(localStorage.getItem(SOAP_CONFIG.STORAGE.LOGIN_KEY)).toBe('1');

      (service as any).setStorage(false);
      expect(localStorage.getItem(SOAP_CONFIG.STORAGE.LOGIN_KEY)).toBe('0');
    });

    it('should read authentication state from localStorage', () => {
      localStorage.setItem(SOAP_CONFIG.STORAGE.LOGIN_KEY, '1');
      expect((service as any).getFromStorage()).toBeTrue();

      localStorage.setItem(SOAP_CONFIG.STORAGE.LOGIN_KEY, '0');
      expect((service as any).getFromStorage()).toBeFalse();

      localStorage.removeItem(SOAP_CONFIG.STORAGE.LOGIN_KEY);
      expect((service as any).getFromStorage()).toBeFalse();
    });
  });

  describe('Error Handling Utilities', () => {
    it('should identify retryable errors correctly', () => {
      const networkError = { status: 0 };
      const serverError = { status: 500 };
      const timeoutError = { name: 'TimeoutError' };
      const clientError = { status: 400 };

      expect((service as any).isRetryableError(networkError)).toBeTrue();
      expect((service as any).isRetryableError(serverError)).toBeTrue();
      expect((service as any).isRetryableError(timeoutError)).toBeTrue();
      expect((service as any).isRetryableError(clientError)).toBeFalse();
    });

    it('should generate unique request IDs', () => {
      const id1 = (service as any).generateRequestId();
      const id2 = (service as any).generateRequestId();

      expect(id1).toMatch(/^auth-\d+-\w+$/);
      expect(id2).toMatch(/^auth-\d+-\w+$/);
      expect(id1).not.toBe(id2);
    });
  });
});
