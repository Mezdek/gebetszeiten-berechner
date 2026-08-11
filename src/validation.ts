import { VALIDATION_RANGES } from './constants.ts';
import { isValidTimeZone } from './core/timezone.ts';
import type { MessageKey } from './i18n/messages.ts';

export interface FieldValidation {
  valid: boolean;
  /** Translation key for the error message, resolved by the UI layer. */
  errorKey?: MessageKey;
}

function inRange(value: number, range: { min: number; max: number }): boolean {
  return Number.isFinite(value) && value >= range.min && value <= range.max;
}

export function validateLatitude(value: number): FieldValidation {
  return inRange(value, VALIDATION_RANGES.latitudeDeg) ? { valid: true } : { valid: false, errorKey: 'errorLatitude' };
}

export function validateLongitude(value: number): FieldValidation {
  return inRange(value, VALIDATION_RANGES.longitudeDeg) ? { valid: true } : { valid: false, errorKey: 'errorLongitude' };
}

/** Whole-degree part of a latitude/longitude entered as degrees/minutes/seconds. */
export function validateDmsDegrees(value: number, axis: 'lat' | 'lon'): FieldValidation {
  const range = axis === 'lat' ? VALIDATION_RANGES.dmsDegreesLat : VALIDATION_RANGES.dmsDegreesLon;
  return Number.isInteger(value) && inRange(value, range) ? { valid: true } : { valid: false, errorKey: 'errorDmsDegrees' };
}

/** Arcminutes or arcseconds part of a degrees/minutes/seconds coordinate: base-60, [0, 60). */
export function validateDmsMinutesOrSeconds(value: number): FieldValidation {
  return Number.isFinite(value) && value >= 0 && value < VALIDATION_RANGES.dmsMinutesSeconds.max
    ? { valid: true }
    : { valid: false, errorKey: 'errorDmsMinutesSeconds' };
}

export function validateElevation(value: number): FieldValidation {
  return inRange(value, VALIDATION_RANGES.elevationM) ? { valid: true } : { valid: false, errorKey: 'errorElevation' };
}

export function validateTimezone(value: string): FieldValidation {
  if (value.trim().length === 0) return { valid: false, errorKey: 'errorTimezoneRequired' };
  return isValidTimeZone(value) ? { valid: true } : { valid: false, errorKey: 'errorTimezoneUnknown' };
}

export function validateDepressionAngle(value: number): FieldValidation {
  return inRange(value, VALIDATION_RANGES.depressionAngleDeg)
    ? { valid: true }
    : { valid: false, errorKey: 'errorDepressionAngle' };
}

export function validateHijriOffset(value: number): FieldValidation {
  return Number.isInteger(value) && inRange(value, VALIDATION_RANGES.hijriOffsetDays)
    ? { valid: true }
    : { valid: false, errorKey: 'errorHijriOffset' };
}

export function validateMinuteOffset(value: number): FieldValidation {
  return Number.isInteger(value) && inRange(value, VALIDATION_RANGES.minuteOffset)
    ? { valid: true }
    : { valid: false, errorKey: 'errorMinuteOffset' };
}

export function validateYear(value: number): FieldValidation {
  return Number.isInteger(value) && value >= 1900 && value <= 2200 ? { valid: true } : { valid: false, errorKey: 'errorYear' };
}

export function validateGenerator(value: string): FieldValidation {
  return value.trim().length > 0 ? { valid: true } : { valid: false, errorKey: 'errorGeneratorRequired' };
}

export function validateMetaKey(key: string): FieldValidation {
  return key.trim().length > 0 ? { valid: true } : { valid: false, errorKey: 'errorMetaKeyRequired' };
}
