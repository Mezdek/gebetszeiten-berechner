import type { AsrMethod, PrayerName, RoundingDirection } from './types.ts';

/**
 * Rounding direction per prayer. Fixed by design, not an operator setting.
 * Do not make this configurable.
 */
export const ROUNDING_DIRECTIONS: Readonly<Record<PrayerName, RoundingDirection>> = {
  fajr: 'down',
  shuruq: 'down',
  dhuhr: 'up',
  asr: 'up',
  maghrib: 'up',
  isha: 'up',
};

/** Used when the operator leaves elevation blank. */
export const DEFAULT_ELEVATION_M = 0;

/** Shafiʿi/Maliki/Hanbali shadow factor, used when the operator leaves Asr method unset. */
export const DEFAULT_ASR_METHOD: AsrMethod = 1;

/** Valid input ranges, enforced by the validation module. */
export const VALIDATION_RANGES = {
  latitudeDeg: { min: -90, max: 90 },
  longitudeDeg: { min: -180, max: 180 },
  /** Whole-degree part of a latitude entered as degrees/minutes/seconds. */
  dmsDegreesLat: { min: 0, max: 90 },
  /** Whole-degree part of a longitude entered as degrees/minutes/seconds. */
  dmsDegreesLon: { min: 0, max: 180 },
  /** Arcminutes and arcseconds are base-60, both entered in the same [0, 60) range. */
  dmsMinutesSeconds: { min: 0, max: 60 },
  elevationM: { min: 0, max: 9000 },
  /** Depression angles used by every published calculation method fall within this band. */
  depressionAngleDeg: { min: 2, max: 30 },
  hijriOffsetDays: { min: -2, max: 2 },
  minuteOffset: { min: -60, max: 60 },
} as const;

/**
 * Astronomical constants.
 *
 * The solar position is computed with the low-precision solar coordinates
 * algorithm from Jean Meeus, "Astronomical Algorithms" (2nd ed.), chapter 25,
 * which is accurate to about 0.01° in the years 1900-2100 — far beyond what a
 * one-minute-resolution prayer time needs. All angles below are in degrees;
 * T is the number of Julian centuries of 36525 days since epoch J2000.0.
 */
export const ASTRONOMICAL_CONSTANTS = {
  /** Julian Day Number of the J2000.0 epoch (2000-01-01 12:00 TT). */
  JULIAN_DAY_J2000: 2451545.0,
  /** Length of a Julian century, in days. */
  DAYS_PER_JULIAN_CENTURY: 36525,

  /** Mean obliquity of the ecliptic at J2000.0, degrees (Meeus 22.2). */
  MEAN_OBLIQUITY_J2000_DEG: 23.4392911,
  /** First-order secular decrease of the mean obliquity, degrees per century. */
  MEAN_OBLIQUITY_RATE_DEG_PER_CENTURY: -0.0130042,

  /** Sun's mean longitude at J2000.0, degrees (Meeus 25.2). */
  SUN_MEAN_LONGITUDE_DEG: 280.46646,
  /** Rate of change of the sun's mean longitude, degrees per century. */
  SUN_MEAN_LONGITUDE_RATE_DEG_PER_CENTURY: 36000.76983,
  SUN_MEAN_LONGITUDE_RATE_DEG_PER_CENTURY_SQ: 0.0003032,

  /** Sun's mean anomaly at J2000.0, degrees (Meeus 25.3). */
  SUN_MEAN_ANOMALY_DEG: 357.52911,
  /** Rate of change of the sun's mean anomaly, degrees per century. */
  SUN_MEAN_ANOMALY_RATE_DEG_PER_CENTURY: 35999.05029,
  SUN_MEAN_ANOMALY_RATE_DEG_PER_CENTURY_SQ: -0.0001537,

  /** Equation-of-center coefficients for the sun, degrees (Meeus p. 164). */
  SUN_EQ_CENTER_C1: 1.914602,
  SUN_EQ_CENTER_C1_T: -0.004817,
  SUN_EQ_CENTER_C1_T2: -0.000014,
  SUN_EQ_CENTER_C2: 0.019993,
  SUN_EQ_CENTER_C2_T: -0.000101,
  SUN_EQ_CENTER_C3: 0.000289,

  /** Standard atmospheric refraction at the apparent horizon, degrees (34 arcminutes). */
  ATMOSPHERIC_REFRACTION_DEG: 34 / 60,
  /** Angular radius of the sun's disc, degrees (16 arcminutes). */
  SOLAR_ANGULAR_RADIUS_DEG: 16 / 60,
  /**
   * Coefficient for the dip of the horizon caused by observer elevation,
   * degrees per sqrt(metre): dip ≈ 0.0347 * sqrt(elevation in metres).
   */
  ELEVATION_DIP_COEFFICIENT_DEG_PER_SQRT_M: 0.0347,
} as const;
