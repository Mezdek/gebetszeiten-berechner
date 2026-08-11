import type { CalculationSettings, DayTimes, Location, MinuteOffsets } from '../types.ts';
import { daysInGregorianYear } from './julian.ts';
import { calculateDayTimes } from './times.ts';
import { gregorianToHijri } from './hijri.ts';

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Iterates every calendar date of a Gregorian year as (year, month, day). */
export function* datesInYear(year: number): Generator<{ year: number; month: number; day: number }> {
  const total = daysInGregorianYear(year);
  let month = 1;
  let day = 1;
  const daysInMonth = [31, isLeap(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let emitted = 0;
  while (emitted < total) {
    yield { year, month, day };
    emitted++;
    day++;
    if (day > (daysInMonth[month - 1] as number)) {
      day = 1;
      month++;
    }
  }
}

function isLeap(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Computes prayer times and Hijri dates for every day of a Gregorian year. */
export function generateYearDays(
  year: number,
  location: Location,
  calculation: CalculationSettings,
  minuteOffsets: MinuteOffsets,
  hijriOffsetDays: number,
): Record<string, DayTimes> {
  const days: Record<string, DayTimes> = {};
  for (const date of datesInYear(year)) {
    const times = calculateDayTimes(date, location, calculation, minuteOffsets);
    const hijri = gregorianToHijri(date, hijriOffsetDays);
    days[isoDate(date.year, date.month, date.day)] = { ...times, hijri };
  }
  return days;
}
