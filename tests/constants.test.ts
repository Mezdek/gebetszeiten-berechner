import { describe, expect, it } from 'vitest';
import { ROUNDING_DIRECTIONS } from '../src/constants.ts';

describe('ROUNDING_DIRECTIONS', () => {
  it('rounds Fajr and Shuruq down, and Dhuhr/Asr/Maghrib/Isha up', () => {
    expect(ROUNDING_DIRECTIONS).toEqual({
      fajr: 'down',
      shuruq: 'down',
      dhuhr: 'up',
      asr: 'up',
      maghrib: 'up',
      isha: 'up',
    });
  });
});
