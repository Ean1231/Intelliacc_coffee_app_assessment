import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { IonContent, IonIcon, IonSpinner, IonAlert } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth/auth.service';
import { UiStateService, LoadingState } from '../../services/ui-state/ui-state.service';
import { Router } from '@angular/router';
import { finalize, takeUntil } from 'rxjs/operators';
import { Subject, Observable } from 'rxjs';
import { LoginError, ApiError } from '../../models/error.models';
import {  InputSanitizer } from 'src/app/validators/coffee.validators';

/**
 * Login page component for user authentication
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonContent, IonIcon, IonSpinner]
})
export class LoginPage implements OnInit, OnDestroy {
  form = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  loadingState$: Observable<LoadingState>;
  errors$: Observable<(LoginError | ApiError)[]>;
  show = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private uiState: UiStateService,
    private router: Router
  ) {
    this.loadingState$ = this.uiState.loading$;
    this.errors$ = this.uiState.errors$;
  }

  ngOnInit() {
    // Clear any existing errors when component initializes
    this.uiState.clearErrors();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Submit login form
   */
  submit(): void {
    if (this.form.invalid || this.uiState.isLoading) {
      return;
    }

    const formValue = this.form.value as { username: string; password: string };
    
    // Sanitize inputs before sending to auth service
    const sanitizedUsername = InputSanitizer.sanitizeUsername(formValue.username);
    const sanitizedPassword = InputSanitizer.sanitizeForSoap(formValue.password);

    this.auth.login(sanitizedUsername, sanitizedPassword)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          if (success) {
            this.router.navigateByUrl('/flavours', { replaceUrl: true });
          }
          // Error handling is now done in AuthService via UiStateService
        },
        error: () => {
          // Error handling is now done in AuthService via UiStateService
        }
      });
  }

  /**
   * Get validation error message for a form field
   */
  getFieldError(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (!field || !field.errors || !field.touched) {
      return '';
    }

    const errors = field.errors;
    
    if (errors['required']) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    
    if (errors['coffeeUsername']) {
      return errors['coffeeUsername'].message;
    }
    
    if (errors['coffeePassword']) {
      const passwordErrors = errors['coffeePassword'];
      // Return the first error message found
      for (const errorType of ['minLength', 'maxLength', 'uppercase', 'lowercase', 'number', 'xmlSafety']) {
        if (passwordErrors[errorType]) {
          return passwordErrors[errorType].message;
        }
      }
    }
    
    return 'Invalid input';
  }

  /**
   * Check if a field has errors and has been touched
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.errors && field.touched);
  }

  /**
   * Dismiss a specific error
   */
  dismissError(index: number): void {
    this.uiState.removeError(index);
  }

  /**
   * Clear all errors
   */
  clearAllErrors(): void {
    this.uiState.clearErrors();
  }
}
