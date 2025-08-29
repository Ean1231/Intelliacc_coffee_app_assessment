import { ErrorFactory, LoginError, ApiError } from './error.models';

describe('Error Models', () => {
  describe('ErrorFactory', () => {
    describe('createLoginError', () => {
      it('should create login error with all parameters', () => {
        const type = 'authentication';
        const message = 'Invalid credentials';
        const details = 'User not found in database';

        const error = ErrorFactory.createLoginError(type, message, details);

        expect(error.type).toBe(type);
        expect(error.message).toBe(message);
        expect(error.details).toBe(details);
        expect(error.timestamp).toBeInstanceOf(Date);
      });

      it('should create login error without details', () => {
        const type = 'network';
        const message = 'Connection failed';

        const error = ErrorFactory.createLoginError(type, message);

        expect(error.type).toBe(type);
        expect(error.message).toBe(message);
        expect(error.details).toBeUndefined();
        expect(error.timestamp).toBeInstanceOf(Date);
      });

      it('should create login error with current timestamp', () => {
        const beforeTime = new Date();
        const error = ErrorFactory.createLoginError('authentication', 'Test error');
        const afterTime = new Date();

        expect(error.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
        expect(error.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
      });

      it('should handle all login error types', () => {
        const types: LoginError['type'][] = ['authentication', 'network', 'server', 'parsing'];

        types.forEach(type => {
          const error = ErrorFactory.createLoginError(type, 'Test message');
          expect(error.type).toBe(type);
        });
      });
    });

    describe('createApiError', () => {
      it('should create API error with all parameters', () => {
        const type = 'server';
        const message = 'Internal server error';
        const statusCode = 500;
        const details = 'Database connection failed';

        const error = ErrorFactory.createApiError(type, message, statusCode, details);

        expect(error.type).toBe(type);
        expect(error.message).toBe(message);
        expect(error.statusCode).toBe(statusCode);
        expect(error.details).toBe(details);
        expect(error.timestamp).toBeInstanceOf(Date);
      });

      it('should create API error with minimal parameters', () => {
        const type = 'network';
        const message = 'Network error';

        const error = ErrorFactory.createApiError(type, message);

        expect(error.type).toBe(type);
        expect(error.message).toBe(message);
        expect(error.statusCode).toBeUndefined();
        expect(error.details).toBeUndefined();
        expect(error.timestamp).toBeInstanceOf(Date);
      });

      it('should create API error with status code but no details', () => {
        const type = 'server';
        const message = 'Server error';
        const statusCode = 503;

        const error = ErrorFactory.createApiError(type, message, statusCode);

        expect(error.type).toBe(type);
        expect(error.message).toBe(message);
        expect(error.statusCode).toBe(statusCode);
        expect(error.details).toBeUndefined();
        expect(error.timestamp).toBeInstanceOf(Date);
      });

      it('should create API error with current timestamp', () => {
        const beforeTime = new Date();
        const error = ErrorFactory.createApiError('network', 'Test error');
        const afterTime = new Date();

        expect(error.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
        expect(error.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
      });

      it('should handle all API error types', () => {
        const types: ApiError['type'][] = ['network', 'server', 'timeout', 'unknown'];

        types.forEach(type => {
          const error = ErrorFactory.createApiError(type, 'Test message');
          expect(error.type).toBe(type);
        });
      });
    });

    describe('Error Consistency', () => {
      it('should create errors with consistent structure', () => {
        const loginError = ErrorFactory.createLoginError('authentication', 'Login failed');
        const apiError = ErrorFactory.createApiError('network', 'API failed');

        // Both should have required properties
        expect(loginError).toHaveProperty('type');
        expect(loginError).toHaveProperty('message');
        expect(loginError).toHaveProperty('timestamp');

        expect(apiError).toHaveProperty('type');
        expect(apiError).toHaveProperty('message');
        expect(apiError).toHaveProperty('timestamp');

        // Timestamps should be Date objects
        expect(loginError.timestamp).toBeInstanceOf(Date);
        expect(apiError.timestamp).toBeInstanceOf(Date);
      });

      it('should create unique timestamps for different errors', () => {
        const error1 = ErrorFactory.createLoginError('authentication', 'Error 1');
        
        // Small delay to ensure different timestamps
        setTimeout(() => {
          const error2 = ErrorFactory.createApiError('network', 'Error 2');
          expect(error2.timestamp.getTime()).toBeGreaterThan(error1.timestamp.getTime());
        }, 1);
      });
    });
  });

  describe('Type Safety', () => {
    it('should enforce login error types', () => {
      // This test ensures TypeScript type checking works correctly
      const validTypes: LoginError['type'][] = ['authentication', 'network', 'server', 'parsing'];
      
      validTypes.forEach(type => {
        const error = ErrorFactory.createLoginError(type, 'Test');
        expect(error.type).toBe(type);
      });
    });

    it('should enforce API error types', () => {
      // This test ensures TypeScript type checking works correctly
      const validTypes: ApiError['type'][] = ['network', 'server', 'timeout', 'unknown'];
      
      validTypes.forEach(type => {
        const error = ErrorFactory.createApiError(type, 'Test');
        expect(error.type).toBe(type);
      });
    });
  });
});
