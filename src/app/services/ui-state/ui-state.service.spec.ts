import { TestBed } from '@angular/core/testing';
import { UiStateService } from './ui-state.service';
import { ErrorFactory } from '../../models/error.models';

describe('UiStateService', () => {
  let service: UiStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UiStateService);
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with no loading state', () => {
      expect(service.isLoading).toBeFalse();
    });

    it('should initialize with no errors', (done) => {
      service.errors$.subscribe(errors => {
        expect(errors.length).toBe(0);
        done();
      });
    });
  });

  describe('Loading State Management', () => {
    it('should start loading without operation', () => {
      service.startLoading();
      expect(service.isLoading).toBeTrue();
    });

    it('should start loading with operation name', (done) => {
      const operation = 'Testing operation';
      service.startLoading(operation);

      service.loading$.subscribe(state => {
        expect(state.isLoading).toBeTrue();
        expect(state.operation).toBe(operation);
        done();
      });
    });

    it('should start loading with operation and progress', (done) => {
      const operation = 'Upload file';
      const progress = 25;
      
      service.startLoading(operation, progress);

      service.loading$.subscribe(state => {
        expect(state.isLoading).toBeTrue();
        expect(state.operation).toBe(operation);
        expect(state.progress).toBe(progress);
        done();
      });
    });

    it('should update progress while loading', (done) => {
      service.startLoading('Processing');
      service.updateProgress(75);

      service.loading$.subscribe(state => {
        expect(state.isLoading).toBeTrue();
        expect(state.progress).toBe(75);
        done();
      });
    });

    it('should not update progress when not loading', () => {
      service.updateProgress(50);
      expect(service.isLoading).toBeFalse();
    });

    it('should stop loading', (done) => {
      service.startLoading('Test');
      service.stopLoading();

      service.loading$.subscribe(state => {
        expect(state.isLoading).toBeFalse();
        expect(state.operation).toBeUndefined();
        expect(state.progress).toBeUndefined();
        done();
      });
    });

    it('should emit loading state changes', () => {
      let emissionCount = 0;
      const states: boolean[] = [];

      service.loading$.subscribe(state => {
        states.push(state.isLoading);
        emissionCount++;
      });

      service.startLoading();
      service.stopLoading();

      expect(emissionCount).toBe(3); // Initial + start + stop
      expect(states).toEqual([false, true, false]);
    });
  });

  describe('Error Management', () => {
    it('should add login error', (done) => {
      const error = ErrorFactory.createLoginError('authentication', 'Test error');
      service.addError(error);

      service.errors$.subscribe(errors => {
        expect(errors.length).toBe(1);
        expect(errors[0]).toBe(error);
        done();
      });
    });

    it('should add API error', (done) => {
      const error = ErrorFactory.createApiError('network', 'Network failed', 500);
      service.addError(error);

      service.errors$.subscribe(errors => {
        expect(errors.length).toBe(1);
        expect(errors[0]).toBe(error);
        done();
      });
    });

    it('should add multiple errors', (done) => {
      const error1 = ErrorFactory.createLoginError('authentication', 'Auth error');
      const error2 = ErrorFactory.createApiError('server', 'Server error');

      service.addError(error1);
      service.addError(error2);

      service.errors$.subscribe(errors => {
        expect(errors.length).toBe(2);
        expect(errors[0]).toBe(error1);
        expect(errors[1]).toBe(error2);
        done();
      });
    });

    it('should clear all errors', (done) => {
      // Add some errors
      service.addError(ErrorFactory.createLoginError('authentication', 'Error 1'));
      service.addError(ErrorFactory.createApiError('network', 'Error 2'));

      // Clear all errors
      service.clearErrors();

      service.errors$.subscribe(errors => {
        expect(errors.length).toBe(0);
        done();
      });
    });

    it('should remove error by index', (done) => {
      const error1 = ErrorFactory.createLoginError('authentication', 'Error 1');
      const error2 = ErrorFactory.createApiError('network', 'Error 2');
      const error3 = ErrorFactory.createLoginError('parsing', 'Error 3');

      service.addError(error1);
      service.addError(error2);
      service.addError(error3);

      // Remove middle error
      service.removeError(1);

      service.errors$.subscribe(errors => {
        expect(errors.length).toBe(2);
        expect(errors[0]).toBe(error1);
        expect(errors[1]).toBe(error3);
        done();
      });
    });

    it('should handle invalid index when removing error', () => {
      const error = ErrorFactory.createLoginError('authentication', 'Test error');
      service.addError(error);

      // Try to remove with invalid indices
      service.removeError(-1);
      service.removeError(10);

      service.errors$.subscribe(errors => {
        expect(errors.length).toBe(1);
        expect(errors[0]).toBe(error);
      });
    });

    it('should clear errors by type', (done) => {
      const loginError1 = ErrorFactory.createLoginError('authentication', 'Auth error 1');
      const loginError2 = ErrorFactory.createLoginError('network', 'Network error');
      const apiError = ErrorFactory.createApiError('server', 'Server error');

      service.addError(loginError1);
      service.addError(loginError2);
      service.addError(apiError);

      // Clear only network errors
      service.clearErrorsByType('network');

      service.errors$.subscribe(errors => {
        expect(errors.length).toBe(2);
        expect(errors.some(e => e.type === 'network')).toBeFalse();
        expect(errors.some(e => e.type === 'authentication')).toBeTrue();
        expect(errors.some(e => e.type === 'server')).toBeTrue();
        done();
      });
    });

    it('should emit error state changes', () => {
      let emissionCount = 0;
      const errorCounts: number[] = [];

      service.errors$.subscribe(errors => {
        errorCounts.push(errors.length);
        emissionCount++;
      });

      service.addError(ErrorFactory.createLoginError('authentication', 'Error 1'));
      service.addError(ErrorFactory.createApiError('network', 'Error 2'));
      service.removeError(0);
      service.clearErrors();

      expect(emissionCount).toBe(5); // Initial + 4 operations
      expect(errorCounts).toEqual([0, 1, 2, 1, 0]);
    });
  });

  describe('Observable Behavior', () => {
    it('should provide current loading state to new subscribers', () => {
      service.startLoading('Test operation', 50);

      // New subscriber should get current state immediately
      service.loading$.subscribe(state => {
        expect(state.isLoading).toBeTrue();
        expect(state.operation).toBe('Test operation');
        expect(state.progress).toBe(50);
      });
    });

    it('should provide current errors to new subscribers', () => {
      const error = ErrorFactory.createLoginError('authentication', 'Test error');
      service.addError(error);

      // New subscriber should get current errors immediately
      service.errors$.subscribe(errors => {
        expect(errors.length).toBe(1);
        expect(errors[0]).toBe(error);
      });
    });
  });
});
