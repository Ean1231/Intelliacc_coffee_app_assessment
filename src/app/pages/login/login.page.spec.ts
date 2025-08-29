import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { LoginPage } from './login.page';
import { AuthService } from '../../services/auth/auth.service';
import { UiStateService, LoadingState } from '../../services/ui-state/ui-state.service';
import { ErrorFactory } from '../../models/error.models';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let uiStateServiceSpy: jasmine.SpyObj<UiStateService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockLoadingState: LoadingState = { isLoading: false };
  const mockErrors = [ErrorFactory.createLoginError('authentication', 'Test error')];

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['login']);
    const uiStateSpy = jasmine.createSpyObj('UiStateService', [
      'clearErrors', 'removeError'
    ], {
      loading$: of(mockLoadingState),
      errors$: of(mockErrors)
    });
    
    // Configure isLoading as a getter
    Object.defineProperty(uiStateSpy, 'isLoading', {
      get: jasmine.createSpy('isLoading').and.returnValue(false),
      configurable: true
    });
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigateByUrl']);

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, LoginPage],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: UiStateService, useValue: uiStateSpy },
        { provide: Router, useValue: routerSpyObj }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    uiStateServiceSpy = TestBed.inject(UiStateService) as jasmine.SpyObj<UiStateService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
  it('should create', () => {
    expect(component).toBeTruthy();
  });

    it('should initialize form with empty values', () => {
      expect(component.form.get('username')?.value).toBe('');
      expect(component.form.get('password')?.value).toBe('');
    });

    it('should initialize form with required validators', () => {
      const usernameControl = component.form.get('username');
      const passwordControl = component.form.get('password');

      expect(usernameControl?.hasError('required')).toBeTrue();
      expect(passwordControl?.hasError('required')).toBeTrue();
    });

    it('should clear errors on init', () => {
      expect(uiStateServiceSpy.clearErrors).toHaveBeenCalled();
    });

    it('should subscribe to loading state', () => {
      expect(component.loadingState$).toBeDefined();
    });

    it('should subscribe to errors', () => {
      expect(component.errors$).toBeDefined();
    });
  });

  describe('Form Validation', () => {
    it('should be invalid when empty', () => {
      expect(component.form.valid).toBeFalse();
    });

    it('should be invalid with only username', () => {
      component.form.patchValue({ username: 'testuser' });
      expect(component.form.valid).toBeFalse();
    });

    it('should be invalid with only password', () => {
      component.form.patchValue({ password: 'testpass' });
      expect(component.form.valid).toBeFalse();
    });

    it('should be valid with both username and password', () => {
      component.form.patchValue({
        username: 'testuser',
        password: 'testpass'
      });
      expect(component.form.valid).toBeTrue();
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      component.form.patchValue({
        username: 'testuser',
        password: 'testpass'
      });
    });

    it('should not submit when form is invalid', () => {
      component.form.patchValue({ username: '' }); // Make form invalid
      component.submit();
      expect(authServiceSpy.login).not.toHaveBeenCalled();
    });

    it('should not submit when loading', () => {
      // Mock the isLoading getter to return true
      Object.defineProperty(uiStateServiceSpy, 'isLoading', {
        get: () => true,
        configurable: true
      });
      
      component.submit();
      expect(authServiceSpy.login).not.toHaveBeenCalled();
    });

    it('should call auth service with form values', () => {
      authServiceSpy.login.and.returnValue(of(true));
      component.submit();

      expect(authServiceSpy.login).toHaveBeenCalledWith('testuser', 'testpass');
    });

    it('should navigate to flavours on successful login', () => {
      authServiceSpy.login.and.returnValue(of(true));
      component.submit();

      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/flavours', { replaceUrl: true });
    });

    it('should not navigate on failed login', () => {
      authServiceSpy.login.and.returnValue(of(false));
      component.submit();

      expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should handle login errors gracefully', () => {
      authServiceSpy.login.and.returnValue(throwError(() => new Error('Network error')));
      
      expect(() => component.submit()).not.toThrow();
      expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should unsubscribe on component destroy', () => {
      const subscription = component.submit();
      spyOn((component as any).destroy$, 'next');
      spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();

      expect((component as any).destroy$.next).toHaveBeenCalled();
      expect((component as any).destroy$.complete).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should dismiss specific error', () => {
      const errorIndex = 1;
      component.dismissError(errorIndex);

      expect(uiStateServiceSpy.removeError).toHaveBeenCalledWith(errorIndex);
    });

    it('should clear all errors', () => {
      component.clearAllErrors();

      expect(uiStateServiceSpy.clearErrors).toHaveBeenCalledTimes(2); // Once in ngOnInit, once in method
    });
  });

  describe('UI State Integration', () => {
    it('should display loading state', () => {
      component.loadingState$.subscribe(state => {
        expect(state).toBe(mockLoadingState);
      });
    });

    it('should display errors', () => {
      component.errors$.subscribe(errors => {
        expect(errors).toBe(mockErrors);
      });
    });
  });

  describe('Component Lifecycle', () => {
    it('should handle ngOnDestroy properly', () => {
      spyOn((component as any).destroy$, 'next');
      spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();

      expect((component as any).destroy$.next).toHaveBeenCalled();
      expect((component as any).destroy$.complete).toHaveBeenCalled();
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should initialize with password hidden', () => {
      expect(component.show).toBeFalse();
    });

    it('should toggle password visibility', () => {
      const initialState = component.show;
      // Simulate clicking the eye icon
      component.show = !component.show;
      expect(component.show).toBe(!initialState);
    });
  });
});