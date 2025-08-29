import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Custom validators for coffee-related business rules
 */

/**
 * Validator for coffee usernames - ensures safe characters for SOAP
 */
export function coffeeUsernameValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null; // Let required validator handle empty values
    }

    const value = control.value.toString().trim();
    
    // Check minimum length
    if (value.length < 3) {
      return { 
        coffeeUsername: { 
          message: 'Username must be at least 3 characters long',
          actualLength: value.length 
        } 
      };
    }
    
    // Check maximum length
    if (value.length > 50) {
      return { 
        coffeeUsername: { 
          message: 'Username cannot be longer than 50 characters',
          actualLength: value.length 
        } 
      };
    }
    
    // Check for safe characters (alphanumeric, underscore, hyphen, period)
    const safePattern = /^[a-zA-Z0-9._-]+$/;
    if (!safePattern.test(value)) {
      return { 
        coffeeUsername: { 
          message: 'Username can only contain letters, numbers, periods, hyphens, and underscores',
          invalidChars: value.replace(/[a-zA-Z0-9._-]/g, '').split('').filter((char: any, index: any, arr: string | any[]) => arr.indexOf(char) === index)
        } 
      };
    }
    
    // Check for SOAP-unsafe characters that could break XML
    const xmlUnsafePattern = /[<>&'"]/;
    if (xmlUnsafePattern.test(value)) {
      return { 
        coffeeUsername: { 
          message: 'Username contains characters that are not allowed',
          reason: 'XML safety'
        } 
      };
    }
    
    return null;
  };
}

/**
 * Validator for coffee passwords - ensures strength and SOAP safety
 */
export function coffeePasswordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null; // Let required validator handle empty values
    }

    const value = control.value.toString();
    const errors: any = {};
    
    // Check minimum length
    if (value.length < 8) {
      errors.minLength = {
        message: 'Password must be at least 8 characters long',
        actualLength: value.length
      };
    }
    
    // Check maximum length for SOAP safety
    if (value.length > 128) {
      errors.maxLength = {
        message: 'Password cannot be longer than 128 characters',
        actualLength: value.length
      };
    }
    
    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(value)) {
      errors.uppercase = {
        message: 'Password must contain at least one uppercase letter'
      };
    }
    
    // Check for at least one lowercase letter
    if (!/[a-z]/.test(value)) {
      errors.lowercase = {
        message: 'Password must contain at least one lowercase letter'
      };
    }
    
    // Check for at least one number
    if (!/\d/.test(value)) {
      errors.number = {
        message: 'Password must contain at least one number'
      };
    }
    
    // Check for SOAP-unsafe characters
    const xmlUnsafePattern = /[<>&'"]/;
    if (xmlUnsafePattern.test(value)) {
      errors.xmlSafety = {
        message: 'Password contains characters that are not allowed',
        reason: 'Security restrictions'
      };
    }
    
    return Object.keys(errors).length > 0 ? { coffeePassword: errors } : null;
  };
}

/**
 * Validator for coffee quantities
 */
export function coffeeQuantityValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value && control.value !== 0) {
      return null; // Let required validator handle empty values
    }

    const value = Number(control.value);
    
    if (isNaN(value)) {
      return { 
        coffeeQuantity: { 
          message: 'Quantity must be a valid number',
          providedValue: control.value
        } 
      };
    }
    
    if (value < 1) {
      return { 
        coffeeQuantity: { 
          message: 'Quantity must be at least 1',
          providedValue: value
        } 
      };
    }
    
    if (value > 99) {
      return { 
        coffeeQuantity: { 
          message: 'Quantity cannot exceed 99 items per order',
          providedValue: value
        } 
      };
    }
    
    if (!Number.isInteger(value)) {
      return { 
        coffeeQuantity: { 
          message: 'Quantity must be a whole number',
          providedValue: value
        } 
      };
    }
    
    return null;
  };
}

/**
 * Validator for coffee prices
 */
export function coffeePriceValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value && control.value !== 0) {
      return null; // Let required validator handle empty values
    }

    const value = Number(control.value);
    
    if (isNaN(value)) {
      return { 
        coffeePrice: { 
          message: 'Price must be a valid number',
          providedValue: control.value
        } 
      };
    }
    
    if (value < 0) {
      return { 
        coffeePrice: { 
          message: 'Price cannot be negative',
          providedValue: value
        } 
      };
    }
    
    if (value > 999.99) {
      return { 
        coffeePrice: { 
          message: 'Price cannot exceed $999.99',
          providedValue: value
        } 
      };
    }
    
    // Check for valid currency format (max 2 decimal places)
    const decimalPlaces = (value.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      return { 
        coffeePrice: { 
          message: 'Price can have at most 2 decimal places',
          providedValue: value,
          decimalPlaces
        } 
      };
    }
    
    return null;
  };
}

/**
 * Input sanitization utilities
 */
export class InputSanitizer {
  /**
   * Sanitize input for SOAP XML - escape XML entities
   */
  static sanitizeForSoap(input: string): string {
    if (!input) return '';
    
    return input
      .replace(/&/g, '&amp;')   // Must be first
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .trim();
  }
  
  /**
   * Sanitize username input
   */
  static sanitizeUsername(input: string): string {
    if (!input) return '';
    
    // Remove unsafe characters and normalize
    return input
      .trim()
      .replace(/[<>&'"]/g, '') // Remove XML-unsafe chars
      .replace(/\s+/g, '_')    // Replace spaces with underscores
      .toLowerCase();
  }
  
  /**
   * Validate and sanitize text input for coffee descriptions
   */
  static sanitizeDescription(input: string): string {
    if (!input) return '';
    
    return input
      .trim()
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .substring(0, 500);      // Limit length
  }
  
  /**
   * Sanitize numeric input
   */
  static sanitizeNumber(input: string | number, precision = 2): number | null {
    const num = Number(input);
    if (isNaN(num)) return null;
    
    return Math.round(num * Math.pow(10, precision)) / Math.pow(10, precision);
  }
}

/**
 * Business logic validators
 */
export class CoffeeBusinessRules {
  /**
   * Calculate total price with size multiplier and validation
   */
  static calculateTotalPrice(
    basePrice: number, 
    sizeMultiplier: number, 
    quantity: number
  ): { total: number; breakdown: { base: number; multiplier: number; quantity: number } } | null {
    
    // Validate inputs
    if (basePrice < 0 || sizeMultiplier <= 0 || quantity < 1) {
      return null;
    }
    
    const sizeAdjustedPrice = basePrice * sizeMultiplier;
    const total = sizeAdjustedPrice * quantity;
    
    // Ensure reasonable total
    if (total > 9999.99) {
      return null; // Prevent unreasonable orders
    }
    
    return {
      total: InputSanitizer.sanitizeNumber(total, 2) || 0,
      breakdown: {
        base: InputSanitizer.sanitizeNumber(basePrice, 2) || 0,
        multiplier: InputSanitizer.sanitizeNumber(sizeMultiplier, 2) || 0,
        quantity
      }
    };
  }
  
  /**
   * Validate coffee intensity range
   */
  static validateIntensity(intensity: number): boolean {
    return Number.isInteger(intensity) && intensity >= 1 && intensity <= 5;
  }
  
  /**
   * Validate coffee category
   */
  static validateCategory(category: string): boolean {
    const validCategories = ['espresso', 'americano', 'latte', 'cappuccino', 'mocha', 'specialty'];
    return validCategories.includes(category.toLowerCase());
  }
  
  /**
   * Validate roast level
   */
  static validateRoastLevel(roastLevel: string): boolean {
    const validRoastLevels = ['light', 'medium', 'dark', 'extra-dark'];
    return validRoastLevels.includes(roastLevel.toLowerCase());
  }
}
