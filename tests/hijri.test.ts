import { describe, expect, it } from 'vitest';
import { gregorianToHijri } from '../src/core/hijri.ts';

describe('gregorianToHijri (Umm al-Qurā via @umalqura/core)', () => {
  it('matches the known Umm al-Qurā date for 2027-01-01', () => {
    expect(gregorianToHijri({ year: 2027, month: 1, day: 1 }, 0)).toEqual({ day: 23, month: 7, year: 1448 });
  });

  it('applies a +1 day global offset before writing the result', () => {
    expect(gregorianToHijri({ year: 2027, month: 1, day: 1 }, 1)).toEqual({ day: 24, month: 7, year: 1448 });
  });

  it('applies a -1 day global offset before writing the result', () => {
    expect(gregorianToHijri({ year: 2027, month: 1, day: 1 }, -1)).toEqual({ day: 22, month: 7, year: 1448 });
  });

  it('works across a Gregorian leap day', () => {
    expect(gregorianToHijri({ year: 2028, month: 2, day: 29 }, 0)).toEqual({ day: 4, month: 10, year: 1449 });
  });
});
