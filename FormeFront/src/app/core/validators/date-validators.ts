import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Requires the control value (date string or Date) to be in the future. */
export function futureDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value == null || control.value === '') {
      return null;
    }
    const value = control.value;
    const date = typeof value === 'string' ? new Date(value) : value;
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return { futureDate: { message: 'Invalid date' } };
    }
    if (date.getTime() <= Date.now()) {
      return { futureDate: { message: 'Date must be in the future' } };
    }
    return null;
  };
}
