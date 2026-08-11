import { describe, expect, it } from 'vitest';
import { translate } from '../src/i18n/index.ts';
import {
  validateDepressionAngle,
  validateDmsDegrees,
  validateDmsMinutesOrSeconds,
  validateElevation,
  validateGenerator,
  validateHijriOffset,
  validateLatitude,
  validateLongitude,
  validateMetaKey,
  validateMinuteOffset,
  validateTimezone,
  validateYear,
  type FieldValidation,
} from '../src/validation.ts';

/**
 * Every failing validator must carry an errorKey that actually resolves to
 * real text in both catalogs — a mismatched key (e.g. "error.foo" vs the
 * catalog's "errorFoo") silently renders as an empty error message.
 */
describe('every validation errorKey resolves to non-empty text in de and ar', () => {
  const failures: FieldValidation[] = [
    validateLatitude(999),
    validateLongitude(999),
    validateDmsDegrees(999, 'lat'),
    validateDmsDegrees(999, 'lon'),
    validateDmsMinutesOrSeconds(60),
    validateElevation(-1),
    validateTimezone(''),
    validateTimezone('Not/AZone'),
    validateDepressionAngle(1),
    validateHijriOffset(3),
    validateMinuteOffset(999),
    validateYear(1),
    validateGenerator(''),
    validateMetaKey(''),
  ];

  for (const result of failures) {
    it(`${result.errorKey} translates in both languages`, () => {
      expect(result.valid).toBe(false);
      expect(result.errorKey).toBeDefined();
      if (!result.errorKey) return;
      expect(translate('de', result.errorKey)).not.toBe('');
      expect(translate('ar', result.errorKey)).not.toBe('');
    });
  }
});
