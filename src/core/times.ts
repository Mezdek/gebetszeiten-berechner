import type { AsrMethod, CalculationSettings, Location, MinuteOffsets, PrayerName } from '../types.ts';
import { ROUNDING_DIRECTIONS } from '../constants.ts';
import { julianDayAtUtMidnight } from './julian.ts';
import { asrAltitudeDeg, hourAngleForAltitude, solarPositionAtJulianDay, sunriseSunsetAltitudeDeg } from './solar.ts';
import { utcOffsetMinutesForDate } from './timezone.ts';
import { formatMinutesOfDay, roundMinutes } from './rounding.ts';

export interface GregorianDate {
  year: number;
  /** 1-indexed. */
  month: number;
  day: number;
}

export interface PrayerTimeDetail {
  /** Exact astronomical local clock time, in minutes since that date's midnight (unrounded). */
  exactMinutes: number;
  /** After rounding in the fixed direction for this prayer. */
  roundedMinutes: number;
  /** After applying the operator's minute offset. Kept ≥1440 when the prayer falls after midnight. */
  finalMinutes: number;
  /** "HH:mm" wall-clock time, still attributed to the requested calendar date. */
  display: string;
}

export type DayTimesDetail = Record<PrayerName, PrayerTimeDetail>;

/**
 * Thrown when the sun never reaches a required altitude on the requested
 * date at the configured latitude (permanent day/night for that angle).
 * This is a real astronomical limit, not a defect to paper over with a
 * guessed value.
 */
export class UnreachableSunAngleError extends Error {
  readonly prayer: PrayerName;
  readonly date: GregorianDate;

  constructor(prayer: PrayerName, date: GregorianDate) {
    super(
      `The sun does not reach the altitude required for "${prayer}" on ${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')} at this latitude.`,
    );
    this.name = 'UnreachableSunAngleError';
    this.prayer = prayer;
    this.date = date;
  }
}

function asrShadowAltitude(shadowFactor: AsrMethod, latitudeDeg: number, declinationDeg: number): number {
  return asrAltitudeDeg(shadowFactor, latitudeDeg, declinationDeg);
}

/**
 * Computes all six prayer times for one Gregorian calendar date at a fixed
 * location, in local wall-clock time.
 *
 * Solar noon (and the declination used for every other prayer) is refined
 * with one extra iteration: the equation of time and declination both shift
 * slightly over the few hours between a first guess and the true transit,
 * and a second pass removes that error to well under a second — far beyond
 * what minute-resolution rounding needs, per Jean Meeus' recommendation for
 * this class of low-precision solar algorithm.
 */
export function calculateDayTimesDetailed(
  date: GregorianDate,
  location: Location,
  calculation: CalculationSettings,
  minuteOffsets: MinuteOffsets,
): DayTimesDetail {
  const timezoneOffsetHours = utcOffsetMinutesForDate(location.timezone, date.year, date.month, date.day) / 60;
  const jd0 = julianDayAtUtMidnight(date.year, date.month, date.day);

  const solarNoonLocalHours = (guessHours: number): { noon: number; declinationDeg: number } => {
    const jd = jd0 + (guessHours - timezoneOffsetHours) / 24;
    const { declinationDeg, equationOfTimeMinutes } = solarPositionAtJulianDay(jd);
    const noon = 12 + timezoneOffsetHours - location.longitude / 15 - equationOfTimeMinutes / 60;
    return { noon, declinationDeg };
  };

  let pass = solarNoonLocalHours(12);
  pass = solarNoonLocalHours(pass.noon);
  const { noon: dhuhrHours, declinationDeg } = pass;

  const sunriseSunsetAltitude = sunriseSunsetAltitudeDeg(location.elevation);
  const fajrAltitude = -calculation.fajrAngle;
  const ishaAltitude = -calculation.ishaAngle;
  const asrAltitude = asrShadowAltitude(calculation.asrMethod, location.latitude, declinationDeg);

  const hourAngle = (altitudeDeg: number, prayer: PrayerName): number => {
    const h = hourAngleForAltitude(altitudeDeg, location.latitude, declinationDeg);
    if (h === null) throw new UnreachableSunAngleError(prayer, date);
    return h;
  };

  const fajrHours = dhuhrHours - hourAngle(fajrAltitude, 'fajr') / 15;
  const shuruqHours = dhuhrHours - hourAngle(sunriseSunsetAltitude, 'shuruq') / 15;
  const asrHours = dhuhrHours + hourAngle(asrAltitude, 'asr') / 15;
  const maghribHours = dhuhrHours + hourAngle(sunriseSunsetAltitude, 'maghrib') / 15;
  const ishaHours = dhuhrHours + hourAngle(ishaAltitude, 'isha') / 15;

  const exactHours: Record<PrayerName, number> = {
    fajr: fajrHours,
    shuruq: shuruqHours,
    dhuhr: dhuhrHours,
    asr: asrHours,
    maghrib: maghribHours,
    isha: ishaHours,
  };

  const result = {} as DayTimesDetail;
  for (const prayer of Object.keys(exactHours) as PrayerName[]) {
    const exactMinutes = exactHours[prayer] * 60;
    const roundedMinutes = roundMinutes(exactMinutes, ROUNDING_DIRECTIONS[prayer]);
    const finalMinutes = roundedMinutes + minuteOffsets[prayer];
    result[prayer] = {
      exactMinutes,
      roundedMinutes,
      finalMinutes,
      display: formatMinutesOfDay(finalMinutes),
    };
  }
  return result;
}

/** Convenience wrapper returning only the "HH:mm" display strings. */
export function calculateDayTimes(
  date: GregorianDate,
  location: Location,
  calculation: CalculationSettings,
  minuteOffsets: MinuteOffsets,
): Record<PrayerName, string> {
  const detail = calculateDayTimesDetailed(date, location, calculation, minuteOffsets);
  return {
    fajr: detail.fajr.display,
    shuruq: detail.shuruq.display,
    dhuhr: detail.dhuhr.display,
    asr: detail.asr.display,
    maghrib: detail.maghrib.display,
    isha: detail.isha.display,
  };
}
