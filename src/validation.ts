import { VALIDATION_RANGES } from './constants.ts';
import { isValidTimeZone } from './core/timezone.ts';

export interface FieldValidation {
  valid: boolean;
  /** Translation key for the error message, resolved by the UI layer. */
  errorKey?: string;
}

function inRange(value: number, range: { min: number; max: number }): boolean {
  return Number.isFinite(value) && value >= range.min && value <= range.max;
}

export function validateLatitude(value: number): FieldValidation {
  return inRange(value, VALIDATION_RANGES.latitudeDeg) ? { valid: true } : { valid: false, errorKey: 'error.latitude' };
}

export function validateLongitude(value: number): FieldValidation {
  return inRange(value, VALIDATION_RANGES.longitudeDeg) ? { valid: true } : { valid: false, errorKey: 'error.longitude' };
}

export function validateElevation(value: number): FieldValidation {
  return inRange(value, VALIDATION_RANGES.elevationM) ? { valid: true } : { valid: false, errorKey: 'error.elevation' };
}

export function validateTimezone(value: string): FieldValidation {
  if (value.trim().length === 0) return { valid: false, errorKey: 'error.timezoneRequired' };
  return isValidTimeZone(value) ? { valid: true } : { valid: false, errorKey: 'error.timezoneUnknown' };
}

export function validateDepressionAngle(value: number): FieldValidation {
  return inRange(value, VALIDATION_RANGES.depressionAngleDeg)
    ? { valid: true }
    : { valid: false, errorKey: 'error.depressionAngle' };
}

export function validateHijriOffset(value: number): FieldValidation {
  return Number.isInteger(value) && inRange(value, VALIDATION_RANGES.hijriOffsetDays)
    ? { valid: true }
    : { valid: false, errorKey: 'error.hijriOffset' };
}

export function validateMinuteOffset(value: number): FieldValidation {
  return Number.isInteger(value) && inRange(value, VALIDATION_RANGES.minuteOffset)
    ? { valid: true }
    : { valid: false, errorKey: 'error.minuteOffset' };
}

export function validateYear(value: number): FieldValidation {
  return Number.isInteger(value) && value >= 1900 && value <= 2200
    ? { valid: true }
    : { valid: false, errorKey: 'error.year' };
}

export function validateGenerator(value: string): FieldValidation {
  return value.trim().length > 0 ? { valid: true } : { valid: false, errorKey: 'error.generatorRequired' };
}

export function validateMetaKey(key: string): FieldValidation {
  return key.trim().length > 0 ? { valid: true } : { valid: false, errorKey: 'error.metaKeyRequired' };
}
