import { describe, expect, it } from 'vitest';
import { validateOutputDocument } from '../src/output/schema.ts';
import { buildOutputDocument } from '../src/output/document.ts';
import type { AppConfig } from '../src/types.ts';

const config: AppConfig = {
  // Cairo, not Berlin: at standard 18°/17° angles Berlin has no true
  // astronomical night for part of the summer, which would make full-year
  // generation throw here — orthogonal to what this test is checking.
  location: { latitude: 30.0444, longitude: 31.2357, elevation: 34, timezone: 'Africa/Cairo' },
  calculation: { fajrAngle: 18, ishaAngle: 17, asrMethod: 1 },
  adjustments: {
    minuteOffsets: { fajr: 0, shuruq: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    hijriOffsetDays: 0,
  },
  output: { year: 2027, generator: 'Test Mosque', metaFields: { address: 'Musterstraße 1' }, validateSchema: true },
  language: 'de',
};

describe('validateOutputDocument', () => {
  it('accepts a correctly generated document', () => {
    const doc = buildOutputDocument(config, new Date().toISOString());
    expect(validateOutputDocument(doc, 2027)).toEqual([]);
  });

  it('flags a year mismatch', () => {
    const doc = buildOutputDocument(config, new Date().toISOString());
    expect(validateOutputDocument(doc, 2028).some((f) => f.rule === 'meta.year')).toBe(true);
  });

  it('flags a wrong day count', () => {
    const doc = buildOutputDocument(config, new Date().toISOString());
    delete doc.days['2027-12-31'];
    const failures = validateOutputDocument(doc, 2027);
    expect(failures.some((f) => f.rule === 'days.count')).toBe(true);
  });

  it('flags a malformed time string', () => {
    const doc = buildOutputDocument(config, new Date().toISOString());
    const day = doc.days['2027-06-01'];
    if (day) day.fajr = '5:3';
    const failures = validateOutputDocument(doc, 2027);
    expect(failures.some((f) => f.rule.endsWith('.fajr'))).toBe(true);
  });

  it('flags an out-of-range Hijri day', () => {
    const doc = buildOutputDocument(config, new Date().toISOString());
    const day = doc.days['2027-06-01'];
    if (day) day.hijri = { day: 31, month: 1, year: 1449 };
    const failures = validateOutputDocument(doc, 2027);
    expect(failures.some((f) => f.rule.endsWith('.hijri'))).toBe(true);
  });
});
