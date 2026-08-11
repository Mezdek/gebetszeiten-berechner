import umalqura from '@umalqura/core';
import type { GregorianDate } from './times.ts';
import type { HijriDate } from '../types.ts';

/**
 * Hijri date (Umm al-Qurā calendar) for a Gregorian calendar date, shifted
 * by the operator's global day offset before conversion so the returned
 * date is already the final, corrected one.
 */
export function gregorianToHijri(date: GregorianDate, offsetDays: number): HijriDate {
  // Constructed with the local Date constructor so its year/month/day fields
  // are exactly `date`, regardless of the browser's own timezone: @umalqura/core
  // reads a Date's local calendar fields, not its UTC instant.
  const local = new Date(date.year, date.month - 1, date.day);
  local.setDate(local.getDate() + offsetDays);
  const { hy, hm, hd } = umalqura.$.gregorianToHijri(local);
  return { day: hd, month: hm, year: hy };
}
