/**
 * Julian Day Number for 0h UT of a Gregorian calendar date.
 *
 * Formula from Jean Meeus, "Astronomical Algorithms" (2nd ed.), equation 7.1.
 * Valid for any Gregorian calendar date (after 1582-10-15), which covers
 * every year this tool will ever be asked to generate.
 */
export function julianDayAtUtMidnight(year: number, month: number, day: number): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5;
}

/** Number of days in a Gregorian calendar year: 366 in leap years, 365 otherwise. */
export function daysInGregorianYear(year: number): number {
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  return isLeap ? 366 : 365;
}
