import { ASTRONOMICAL_CONSTANTS as AC } from '../constants.ts';

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

function sinDeg(deg: number): number {
  return Math.sin(deg * DEG_TO_RAD);
}
function cosDeg(deg: number): number {
  return Math.cos(deg * DEG_TO_RAD);
}
function tanDeg(deg: number): number {
  return Math.tan(deg * DEG_TO_RAD);
}
function asinDeg(x: number): number {
  return Math.asin(x) * RAD_TO_DEG;
}
function atan2Deg(y: number, x: number): number {
  return Math.atan2(y, x) * RAD_TO_DEG;
}

/** Normalizes an angle in degrees to the range [0, 360). */
function normalizeDeg360(deg: number): number {
  const r = deg % 360;
  return r < 0 ? r + 360 : r;
}

/** Normalizes an angle in degrees to the range (-180, 180]. */
function normalizeDeg180(deg: number): number {
  let r = normalizeDeg360(deg);
  if (r > 180) r -= 360;
  return r;
}

export interface SolarPosition {
  /** Apparent geocentric declination of the sun, degrees. */
  declinationDeg: number;
  /** Equation of time, in minutes: apparent solar time minus mean solar time. */
  equationOfTimeMinutes: number;
}

/**
 * Low-precision solar coordinates and equation of time.
 *
 * Follows Jean Meeus, "Astronomical Algorithms" (2nd ed.):
 *  - Chapter 25 "Solar Coordinates" (low-accuracy method, error ≲ 0.01°
 *    in longitude for years 1900-2100) for the sun's apparent longitude
 *    and declination.
 *  - Chapter 28 "Equation of Time", using the low-accuracy variant built
 *    from the same apparent longitude and mean anomaly (Meeus notes this
 *    reproduces the equation of time to about 0.1 minute).
 *
 * @param julianDay Julian Day Number (UT) at which to evaluate the sun's position.
 */
export function solarPositionAtJulianDay(julianDay: number): SolarPosition {
  const T = (julianDay - AC.JULIAN_DAY_J2000) / AC.DAYS_PER_JULIAN_CENTURY;

  // Sun's mean longitude, referred to the mean equinox of the date (Meeus 25.2).
  const L0 = normalizeDeg360(
    AC.SUN_MEAN_LONGITUDE_DEG +
      AC.SUN_MEAN_LONGITUDE_RATE_DEG_PER_CENTURY * T +
      AC.SUN_MEAN_LONGITUDE_RATE_DEG_PER_CENTURY_SQ * T * T,
  );

  // Sun's mean anomaly (Meeus 25.3).
  const M = normalizeDeg360(
    AC.SUN_MEAN_ANOMALY_DEG +
      AC.SUN_MEAN_ANOMALY_RATE_DEG_PER_CENTURY * T +
      AC.SUN_MEAN_ANOMALY_RATE_DEG_PER_CENTURY_SQ * T * T,
  );

  // Equation of center (Meeus p. 164).
  const C =
    (AC.SUN_EQ_CENTER_C1 + AC.SUN_EQ_CENTER_C1_T * T + AC.SUN_EQ_CENTER_C1_T2 * T * T) * sinDeg(M) +
    (AC.SUN_EQ_CENTER_C2 + AC.SUN_EQ_CENTER_C2_T * T) * sinDeg(2 * M) +
    AC.SUN_EQ_CENTER_C3 * sinDeg(3 * M);

  // Sun's true longitude, then apparent longitude after correcting for the
  // longitude of the ascending node of the moon's mean orbit (Meeus 25.7),
  // a low-precision stand-in for full nutation + aberration.
  const trueLongitude = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  const apparentLongitude = trueLongitude - 0.00569 - 0.00478 * sinDeg(omega);

  // Mean obliquity of the ecliptic, corrected for nutation the same way (Meeus 25.8).
  const meanObliquity = AC.MEAN_OBLIQUITY_J2000_DEG + AC.MEAN_OBLIQUITY_RATE_DEG_PER_CENTURY * T;
  const correctedObliquity = meanObliquity + 0.00256 * cosDeg(omega);

  const declinationDeg = asinDeg(sinDeg(correctedObliquity) * sinDeg(apparentLongitude));

  // Apparent right ascension (Meeus 25.6, dropping the negligible aberration term).
  const rightAscensionDeg = normalizeDeg360(
    atan2Deg(cosDeg(correctedObliquity) * sinDeg(apparentLongitude), cosDeg(apparentLongitude)),
  );

  // Equation of time (Meeus 28.1, low-accuracy form): E = L0 - 0.0057183 - alpha,
  // normalized to the (-180, 180] range before converting degrees to minutes of time.
  const equationOfTimeMinutes = 4 * normalizeDeg180(L0 - 0.0057183 - rightAscensionDeg);

  return { declinationDeg, equationOfTimeMinutes };
}

/**
 * Hour angle, in degrees, at which the sun reaches altitude `altitudeDeg`
 * for an observer at latitude `latitudeDeg` when the sun's declination is
 * `declinationDeg`. This is the standard spherical-astronomy hour angle
 * equation (Meeus 15.1, solved for H):
 *
 *   cos(H) = (sin(altitude) - sin(lat)·sin(dec)) / (cos(lat)·cos(dec))
 *
 * Returns `null` if the sun never reaches that altitude on that day at that
 * latitude (the argument of arccos falls outside [-1, 1] — permanent day or
 * permanent night for the requested angle).
 */
export function hourAngleForAltitude(altitudeDeg: number, latitudeDeg: number, declinationDeg: number): number | null {
  const cosH =
    (sinDeg(altitudeDeg) - sinDeg(latitudeDeg) * sinDeg(declinationDeg)) / (cosDeg(latitudeDeg) * cosDeg(declinationDeg));
  if (cosH < -1 || cosH > 1) return null;
  return Math.acos(cosH) * RAD_TO_DEG;
}

/**
 * Altitude of the sun, in degrees, at which its shadow-tip geometry matches
 * the Asr definition: shadow length = shadowFactor × object length + the
 * shadow already cast at solar noon. Standard Asr altitude formula:
 *
 *   altitude = arccot(shadowFactor + tan(|latitude - declination|))
 */
export function asrAltitudeDeg(shadowFactor: number, latitudeDeg: number, declinationDeg: number): number {
  const cotAltitude = shadowFactor + Math.abs(tanDeg(latitudeDeg - declinationDeg));
  return atan2Deg(1, cotAltitude);
}

/**
 * Altitude at which sunrise/sunset is deemed to occur: below the geometric
 * horizon by standard atmospheric refraction plus the sun's angular radius,
 * further depressed by the dip of the horizon caused by observer elevation.
 */
export function sunriseSunsetAltitudeDeg(elevationMetres: number): number {
  const dip = AC.ELEVATION_DIP_COEFFICIENT_DEG_PER_SQRT_M * Math.sqrt(Math.max(0, elevationMetres));
  return -(AC.ATMOSPHERIC_REFRACTION_DEG + AC.SOLAR_ANGULAR_RADIUS_DEG + dip);
}
