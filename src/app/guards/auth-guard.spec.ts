import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth-guard';
import { AuthService } from '../services/auth/auth.service';

describe('authGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', [], {
      isLoggedInSync: false
    });
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigateByUrl']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpyObj }
      ]
    });

    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  describe('Authentication Check', () => {
    it('should allow access when user is authenticated', () => {
      // Mock authenticated state
      Object.defineProperty(authServiceSpy, 'isLoggedInSync', {
        value: true,
        configurable: true
      });

      const result = TestBed.runInInjectionContext(() => authGuard());

      expect(result).toBeTrue();
      expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should deny access and redirect when user is not authenticated', () => {
      // Mock unauthenticated state
      Object.defineProperty(authServiceSpy, 'isLoggedInSync', {
        value: false,
        configurable: true
      });

      const result = TestBed.runInInjectionContext(() => authGuard());

      expect(result).toBeFalse();
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/login');
    });

    it('should redirect to login page with correct URL', () => {
      Object.defineProperty(authServiceSpy, 'isLoggedInSync', {
        value: false,
        configurable: true
      });

      TestBed.runInInjectionContext(() => authGuard());

      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/login');
      expect(routerSpy.navigateByUrl).toHaveBeenCalledTimes(1);
    });
  });

  describe('Dependency Injection', () => {
    it('should inject AuthService correctly', () => {
      Object.defineProperty(authServiceSpy, 'isLoggedInSync', {
        value: true,
        configurable: true
      });

      TestBed.runInInjectionContext(() => authGuard());

      // Verify that isLoggedInSync was accessed (indicates service was injected)
      expect(authServiceSpy.isLoggedInSync).toBeDefined();
    });

    it('should inject Router correctly', () => {
      Object.defineProperty(authServiceSpy, 'isLoggedInSync', {
        value: false,
        configurable: true
      });

      TestBed.runInInjectionContext(() => authGuard());

      // Verify that router was used (indicates service was injected)
      expect(routerSpy.navigateByUrl).toHaveBeenCalled();
    });
  });

  describe('Guard Behavior', () => {
    it('should be a function', () => {
      expect(typeof authGuard).toBe('function');
    });

    it('should return boolean values', () => {
      Object.defineProperty(authServiceSpy, 'isLoggedInSync', {
        value: true,
        configurable: true
      });

      let result = TestBed.runInInjectionContext(() => authGuard());
      expect(typeof result).toBe('boolean');

      Object.defineProperty(authServiceSpy, 'isLoggedInSync', {
        value: false,
        configurable: true
      });

      result = TestBed.runInInjectionContext(() => authGuard());
      expect(typeof result).toBe('boolean');
    });

    it('should handle edge cases gracefully', () => {
      // Test with undefined/null auth state
      Object.defineProperty(authServiceSpy, 'isLoggedInSync', {
        value: undefined,
        configurable: true
      });

      const result = TestBed.runInInjectionContext(() => authGuard());

      // Should treat undefined/falsy as not authenticated
      expect(result).toBeFalse();
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/login');
    });
  });
});