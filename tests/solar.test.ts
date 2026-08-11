import { describe, expect, it } from 'vitest';
import { julianDayAtUtMidnight } from '../src/core/julian.ts';
import { solarPositionAtJulianDay } from '../src/core/solar.ts';

/**
 * Cross-checks the low-precision solar coordinates against the astronomical
 * facts that define the solstices and equinoxes: at the solstices the sun's
 * declination equals (within a few hundredths of a degree) the obliquity of
 * the ecliptic (~23.44°), and at the equinoxes it crosses zero.
 */
describe('solar declination at solstices and equinoxes (2027)', () => {
  it('is close to +23.44° at the June solstice', () => {
    const jd = julianDayAtUtMidnight(2027, 6, 21) + 0.5; // ~noon UT
    const { declinationDeg } = solarPositionAtJulianDay(jd);
    expect(declinationDeg).toBeGreaterThan(23.3);
    expect(declinationDeg).toBeLessThan(23.45);
  });

  it('is close to -23.44° at the December solstice', () => {
    const jd = julianDayAtUtMidnight(2027, 12, 21) + 0.5;
    const { declinationDeg } = solarPositionAtJulianDay(jd);
    expect(declinationDeg).toBeLessThan(-23.3);
    expect(declinationDeg).toBeGreaterThan(-23.45);
  });

  it('crosses zero at the March equinox', () => {
    const jd = julianDayAtUtMidnight(2027, 3, 20) + 0.5;
    const { declinationDeg } = solarPositionAtJulianDay(jd);
    expect(Math.abs(declinationDeg)).toBeLessThan(0.6);
  });

  it('crosses zero at the September equinox', () => {
    const jd = julianDayAtUtMidnight(2027, 9, 23) + 0.5;
    const { declinationDeg } = solarPositionAtJulianDay(jd);
    expect(Math.abs(declinationDeg)).toBeLessThan(0.6);
  });

  it('equation of time stays within its known ±17 minute range', () => {
    for (const [m, d] of [
      [2, 11],
      [5, 14],
      [7, 26],
      [11, 3],
    ]) {
      const jd = julianDayAtUtMidnight(2027, m as number, d as number) + 0.5;
      const { equationOfTimeMinutes } = solarPositionAtJulianDay(jd);
      expect(Math.abs(equationOfTimeMinutes)).toBeLessThan(17);
    }
  });
});
