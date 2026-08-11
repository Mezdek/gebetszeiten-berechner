import { describe, expect, it } from 'vitest';
import { calculateDayTimesDetailed } from '../src/core/times.ts';
import { generateYearDays } from '../src/core/year.ts';
import { daysInGregorianYear } from '../src/core/julian.ts';
import type { CalculationSettings, Location, MinuteOffsets } from '../src/types.ts';

const zeroOffsets: MinuteOffsets = { fajr: 0, shuruq: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };

const berlin: Location = { latitude: 52.52, longitude: 13.405, elevation: 0, timezone: 'Europe/Berlin' };
// Cairo stays well clear of Berlin's "no true 18°/17° night" summer window, so a
// full year computes at standard angles without hitting UnreachableSunAngleError —
// useful for tests that are about day-counting/rounding mechanics, not twilight limits.
const cairo: Location = { latitude: 30.0444, longitude: 31.2357, elevation: 0, timezone: 'Africa/Cairo' };
const standardCalc: CalculationSettings = { fajrAngle: 18, ishaAngle: 17, asrMethod: 1 };

describe('DST transitions (Europe/Berlin, 2027: spring forward 2027-03-28, fall back 2027-10-31)', () => {
  it('shifts Dhuhr forward by ~1 hour of local clock time across the spring-forward transition', () => {
    const before = calculateDayTimesDetailed({ year: 2027, month: 3, day: 27 }, berlin, standardCalc, zeroOffsets);
    const after = calculateDayTimesDetailed({ year: 2027, month: 3, day: 28 }, berlin, standardCalc, zeroOffsets);
    // The sun's behaviour barely changes day-to-day, but the clock itself springs
    // forward an hour on the 28th — every clock-based schedule jumps with it.
    // A few minutes of slack absorbs the day-to-day equation-of-time drift.
    const diff = after.dhuhr.exactMinutes - before.dhuhr.exactMinutes;
    expect(diff).toBeGreaterThan(50);
    expect(diff).toBeLessThan(70);
  });

  it('shifts Dhuhr back by ~1 hour of local clock time across the fall-back transition', () => {
    const before = calculateDayTimesDetailed({ year: 2027, month: 10, day: 30 }, berlin, standardCalc, zeroOffsets);
    const after = calculateDayTimesDetailed({ year: 2027, month: 10, day: 31 }, berlin, standardCalc, zeroOffsets);
    const diff = after.dhuhr.exactMinutes - before.dhuhr.exactMinutes;
    expect(diff).toBeLessThan(-50);
    expect(diff).toBeGreaterThan(-70);
  });
});

describe('leap years', () => {
  it('2028 has 366 days, 2027 has 365', () => {
    expect(daysInGregorianYear(2028)).toBe(366);
    expect(daysInGregorianYear(2027)).toBe(365);
  });

  it('generates a Feb 29 entry for a leap year and the correct total day count', () => {
    const days = generateYearDays(2028, cairo, standardCalc, zeroOffsets, 0);
    expect(Object.keys(days)).toHaveLength(366);
    expect(days['2028-02-29']).toBeDefined();
  });

  it('generates exactly 365 entries for a non-leap year', () => {
    const days = generateYearDays(2027, cairo, standardCalc, zeroOffsets, 0);
    expect(Object.keys(days)).toHaveLength(365);
    expect(days['2027-02-29']).toBeUndefined();
  });
});

describe('Isha after midnight (Helsinki, high-latitude near-solstice twilight)', () => {
  // At 60°N around the June solstice the sun's minimum altitude is only a
  // few degrees below the horizon, so a shallow Isha angle is reached only
  // right before local "midnight" — pushing Isha into the next calendar day
  // while still describing the night of the requested date.
  const helsinki: Location = { latitude: 60.17, longitude: 24.94, elevation: 0, timezone: 'Europe/Helsinki' };
  const shallowCalc: CalculationSettings = { fajrAngle: 5, ishaAngle: 5, asrMethod: 1 };

  it('reports Isha finalMinutes at or beyond 1440 (past local midnight)', () => {
    const detail = calculateDayTimesDetailed({ year: 2027, month: 6, day: 21 }, helsinki, shallowCalc, zeroOffsets);
    expect(detail.isha.finalMinutes).toBeGreaterThanOrEqual(1440);
    expect(detail.isha.display).toBe('00:08'); // Isha rounds up
  });

  it('keeps that Isha time attributed to the requested calendar date, without inserting an extra day', () => {
    const days = generateYearDays(2027, helsinki, shallowCalc, zeroOffsets, 0);
    expect(Object.keys(days)).toHaveLength(365); // no synthetic extra date from the midnight overflow
    expect(days['2027-06-21']?.isha).toBe('00:08');
  });
});

describe('rounding + offset ordering inside calculateDayTimesDetailed', () => {
  it('roundedMinutes reflects only rounding; finalMinutes adds the offset on top', () => {
    const offsets: MinuteOffsets = { ...zeroOffsets, fajr: 3, dhuhr: 1, asr: 1, maghrib: -2, isha: -1 };
    const detail = calculateDayTimesDetailed({ year: 2027, month: 6, day: 1 }, cairo, standardCalc, offsets);

    // fajr and shuruq round down
    expect(detail.fajr.roundedMinutes).toBe(Math.floor(detail.fajr.exactMinutes));
    expect(detail.fajr.finalMinutes).toBe(detail.fajr.roundedMinutes + 3);
    expect(detail.shuruq.roundedMinutes).toBe(Math.floor(detail.shuruq.exactMinutes));

    // dhuhr, asr, maghrib, and isha round up
    expect(detail.dhuhr.roundedMinutes).toBe(Math.ceil(detail.dhuhr.exactMinutes));
    expect(detail.dhuhr.finalMinutes).toBe(detail.dhuhr.roundedMinutes + 1);

    expect(detail.asr.roundedMinutes).toBe(Math.ceil(detail.asr.exactMinutes));
    expect(detail.asr.finalMinutes).toBe(detail.asr.roundedMinutes + 1);

    expect(detail.maghrib.roundedMinutes).toBe(Math.ceil(detail.maghrib.exactMinutes));
    expect(detail.maghrib.finalMinutes).toBe(detail.maghrib.roundedMinutes - 2);

    expect(detail.isha.roundedMinutes).toBe(Math.ceil(detail.isha.exactMinutes));
    expect(detail.isha.finalMinutes).toBe(detail.isha.roundedMinutes - 1);
  });
});
