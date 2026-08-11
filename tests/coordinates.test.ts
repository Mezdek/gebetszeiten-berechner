import { describe, expect, it } from 'vitest';
import { decimalToDmsLatitude, decimalToDmsLongitude, dmsToDecimal } from '../src/core/coordinates.ts';
import { validateDmsDegrees, validateDmsMinutesOrSeconds, validateLatitude, validateLongitude } from '../src/validation.ts';

describe('dmsToDecimal', () => {
  it('treats minutes and seconds as base-60, not base-100', () => {
    // 52° 25′ N -> 52 + 25/60, NOT 52.25
    const decimal = dmsToDecimal({ degrees: 52, minutes: 25, seconds: 0, direction: 'N' });
    expect(decimal).toBeCloseTo(52.41667, 4);
    expect(decimal).not.toBeCloseTo(52.25, 4);
  });

  it('handles seconds too', () => {
    // 12° 33′ 0″ E
    expect(dmsToDecimal({ degrees: 12, minutes: 33, seconds: 0, direction: 'E' })).toBeCloseTo(12.55, 6);
  });

  it('negates for S and W', () => {
    expect(dmsToDecimal({ degrees: 33, minutes: 30, seconds: 0, direction: 'S' })).toBeCloseTo(-33.5, 6);
    expect(dmsToDecimal({ degrees: 70, minutes: 15, seconds: 0, direction: 'W' })).toBeCloseTo(-70.25, 6);
  });
});

describe('decimalToDms round-trip', () => {
  it('round-trips a latitude through decimal -> DMS -> decimal', () => {
    const original = 52 + 25 / 60; // exact 52° 25′ 0″ N
    const dms = decimalToDmsLatitude(original);
    expect(dms).toEqual({ degrees: 52, minutes: 25, seconds: 0, direction: 'N' });
    expect(dmsToDecimal(dms)).toBeCloseTo(original, 6);
  });

  it('round-trips a negative longitude (west)', () => {
    const original = -70.25;
    const dms = decimalToDmsLongitude(original);
    expect(dms).toEqual({ degrees: 70, minutes: 15, seconds: 0, direction: 'W' });
  });

  it('carries seconds into minutes when rounding reaches 60', () => {
    // 52 + 59/60 + 59.9999/3600 is just under 53°, must not become "59min 60.0sec"
    const decimal = 52 + 59 / 60 + 59.9999 / 3600;
    const dms = decimalToDmsLatitude(decimal);
    expect(dms.seconds).toBeLessThan(60);
    expect(dms.minutes).toBeLessThan(60);
  });
});

describe('DMS field validation', () => {
  it('accepts valid latitude/longitude degree ranges', () => {
    expect(validateDmsDegrees(90, 'lat').valid).toBe(true);
    expect(validateDmsDegrees(180, 'lon').valid).toBe(true);
  });

  it('rejects degrees outside the axis range', () => {
    expect(validateDmsDegrees(91, 'lat').valid).toBe(false);
    expect(validateDmsDegrees(181, 'lon').valid).toBe(false);
  });

  it('rejects non-integer degrees', () => {
    expect(validateDmsDegrees(52.5, 'lat').valid).toBe(false);
  });

  it('accepts minutes/seconds in [0, 60)', () => {
    expect(validateDmsMinutesOrSeconds(0).valid).toBe(true);
    expect(validateDmsMinutesOrSeconds(59.999).valid).toBe(true);
  });

  it('rejects 60 and above, and negative values', () => {
    expect(validateDmsMinutesOrSeconds(60).valid).toBe(false);
    expect(validateDmsMinutesOrSeconds(-1).valid).toBe(false);
  });

  it('rejects a combined degrees+minutes that pushes the decimal out of range', () => {
    // 90° 1′ N: each part is individually plausible but the combined angle exceeds 90°.
    const decimal = dmsToDecimal({ degrees: 90, minutes: 1, seconds: 0, direction: 'N' });
    expect(validateLatitude(decimal).valid).toBe(false);
  });

  it('accepts exactly the poles/antimeridian as boundary values', () => {
    expect(validateLatitude(dmsToDecimal({ degrees: 90, minutes: 0, seconds: 0, direction: 'N' })).valid).toBe(true);
    expect(validateLongitude(dmsToDecimal({ degrees: 180, minutes: 0, seconds: 0, direction: 'W' })).valid).toBe(true);
  });
});
