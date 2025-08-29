import { Injectable, signal, computed, effect } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LoginError, ApiError } from '../../models/error.models';

/**
 * Loading state interface
 */
export interface LoadingState {
  isLoading: boolean;
  operation?: string;
  progress?: number;
}

/**
 * Persistent error state interface
 */
export interface PersistentErrorState {
  errors: (LoginError | ApiError)[];
  timestamp: number;
}

/**
 * UI state management service for handling loading states and errors
 * 
 * Provides centralized state management for UI concerns like loading indicators,
 * error messages, and progress tracking. Uses reactive patterns with BehaviorSubjects
 * to ensure components stay in sync with the current UI state.
 * 
 * @example
 * ```typescript
 * // Inject the service
 * constructor(private uiState: UiStateService) {}
 * 
 * // Start loading with operation name
 * this.uiState.startLoading('Saving data...');
 * 
 * // Update progress
 * this.uiState.updateProgress(50);
 * 
 * // Stop loading
 * this.uiState.stopLoading();
 * 
 * // Add an error
 * const error = ErrorFactory.createApiError('network', 'Failed to connect');
 * this.uiState.addError(error);
 * 
 * // Subscribe to loading state in component
 * this.loadingState$ = this.uiState.loading$;
 * this.errors$ = this.uiState.errors$;
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class UiStateService {
  private readonly STORAGE_KEY = 'coffee_ui_errors';
  private readonly ERROR_PERSISTENCE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  // Angular Signals for reactive state management
  private readonly loadingStateSignal = signal<LoadingState>({ isLoading: false });
  private readonly errorsSignal = signal<(LoginError | ApiError)[]>(this.loadPersistedErrors());
  
  // Legacy observables for backward compatibility
  private readonly loadingState$ = new BehaviorSubject<LoadingState>({ isLoading: false });
  private readonly errorsSubject$ = new BehaviorSubject<(LoginError | ApiError)[]>(this.loadPersistedErrors());
  
  // Computed signals for derived state
  readonly hasErrors = computed(() => this.errorsSignal().length > 0);
  readonly criticalErrors = computed(() => 
    this.errorsSignal().filter(error => 
      (error.type === 'server' && 'statusCode' in error && error.statusCode && error.statusCode >= 500) ||
      error.type === 'network'
    )
  );
  
  constructor() {
    // Effect to sync signals with observables for backward compatibility
    effect(() => {
      this.loadingState$.next(this.loadingStateSignal());
      this.errorsSubject$.next(this.errorsSignal());
    });
    
    // Effect to persist errors when they change
    effect(() => {
      this.persistErrors(this.errorsSignal());
    });
  }

  /**
   * Get current loading state as observable (legacy support)
   */
  get loading$(): Observable<LoadingState> {
    return this.loadingState$.asObservable();
  }

  /**
   * Get current errors as observable (legacy support)
   */
  get errors$(): Observable<(LoginError | ApiError)[]> {
    return this.errorsSubject$.asObservable();
  }

  /**
   * Get current loading state as signal (recommended)
   */
  get loadingState() {
    return this.loadingStateSignal.asReadonly();
  }

  /**
   * Get current errors as signal (recommended)
   */
  get errors() {
    return this.errorsSignal.asReadonly();
  }

  /**
   * Get current loading state synchronously
   */
  get isLoading(): boolean {
    return this.loadingStateSignal().isLoading;
  }

  /**
   * Start loading state with optional operation name and progress
   * 
   * @param operation - Optional description of the current operation
   * @param progress - Optional progress percentage (0-100)
   * 
   * @example
   * ```typescript
   * // Simple loading
   * this.uiState.startLoading();
   * 
   * // Loading with operation description
   * this.uiState.startLoading('Authenticating user...');
   * 
   * // Loading with operation and initial progress
   * this.uiState.startLoading('Uploading file...', 0);
   * ```
   */
  startLoading(operation?: string, progress?: number): void {
    this.loadingStateSignal.set({
      isLoading: true,
      operation,
      progress
    });
  }

  /**
   * Update loading progress
   */
  updateProgress(progress: number): void {
    const current = this.loadingStateSignal();
    if (current.isLoading) {
      this.loadingStateSignal.set({
        ...current,
        progress
      });
    }
  }

  /**
   * Stop loading state
   */
  stopLoading(): void {
    this.loadingStateSignal.set({ isLoading: false });
  }

  /**
   * Add an error to the error state
   * 
   * @param error - The error object to add (LoginError or ApiError)
   * 
   * @example
   * ```typescript
   * // Add a login error
   * const loginError = ErrorFactory.createLoginError('authentication', 'Invalid credentials');
   * this.uiState.addError(loginError);
   * 
   * // Add an API error
   * const apiError = ErrorFactory.createApiError('network', 'Connection failed', 500);
   * this.uiState.addError(apiError);
   * ```
   */
  addError(error: LoginError | ApiError): void {
    const currentErrors = this.errorsSignal();
    this.errorsSignal.set([...currentErrors, error]);
  }

  /**
   * Clear all errors
   */
  clearErrors(): void {
    this.errorsSignal.set([]);
  }

  /**
   * Remove specific error by index
   */
  removeError(index: number): void {
    const currentErrors = this.errorsSignal();
    if (index >= 0 && index < currentErrors.length) {
      const newErrors = [...currentErrors];
      newErrors.splice(index, 1);
      this.errorsSignal.set(newErrors);
    }
  }

  /**
   * Clear errors of specific type
   */
  clearErrorsByType(type: LoginError['type'] | ApiError['type']): void {
    const currentErrors = this.errorsSignal();
    const filteredErrors = currentErrors.filter(error => error.type !== type);
    this.errorsSignal.set(filteredErrors);
  }

  /**
   * Load persisted errors from storage
   */
  private loadPersistedErrors(): (LoginError | ApiError)[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const persistentState: PersistentErrorState = JSON.parse(stored);
      const now = Date.now();
      
      // Check if errors are still within persistence duration
      if (now - persistentState.timestamp > this.ERROR_PERSISTENCE_DURATION) {
        localStorage.removeItem(this.STORAGE_KEY);
        return [];
      }
      
      // Restore timestamps as Date objects
      return persistentState.errors.map(error => ({
        ...error,
        timestamp: new Date(error.timestamp)
      }));
    } catch (error) {
      console.warn('Failed to load persisted errors:', error);
      localStorage.removeItem(this.STORAGE_KEY);
      return [];
    }
  }

  /**
   * Persist errors to storage
   */
  private persistErrors(errors: (LoginError | ApiError)[]): void {
    try {
      if (errors.length === 0) {
        localStorage.removeItem(this.STORAGE_KEY);
        return;
      }
      
      const persistentState: PersistentErrorState = {
        errors,
        timestamp: Date.now()
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(persistentState));
    } catch (error) {
      console.warn('Failed to persist errors:', error);
    }
  }
}
