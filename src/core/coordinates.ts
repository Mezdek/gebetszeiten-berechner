export type LatitudeDirection = 'N' | 'S';
export type LongitudeDirection = 'E' | 'W';

export interface DmsLatitude {
  degrees: number;
  minutes: number;
  seconds: number;
  direction: LatitudeDirection;
}

export interface DmsLongitude {
  degrees: number;
  minutes: number;
  seconds: number;
  direction: LongitudeDirection;
}

/** Converts a degrees/minutes/seconds coordinate (minutes and seconds are base-60) to signed decimal degrees. */
export function dmsToDecimal(dms: { degrees: number; minutes: number; seconds: number; direction: string }): number {
  const magnitude = dms.degrees + dms.minutes / 60 + dms.seconds / 3600;
  const sign = dms.direction === 'S' || dms.direction === 'W' ? -1 : 1;
  return sign * magnitude;
}

/** Converts signed decimal degrees to degrees/minutes/seconds for the latitude axis (N/S). */
export function decimalToDmsLatitude(decimal: number): DmsLatitude {
  const { degrees, minutes, seconds } = decimalToDmsMagnitude(decimal);
  return { degrees, minutes, seconds, direction: decimal < 0 ? 'S' : 'N' };
}

/** Converts signed decimal degrees to degrees/minutes/seconds for the longitude axis (E/W). */
export function decimalToDmsLongitude(decimal: number): DmsLongitude {
  const { degrees, minutes, seconds } = decimalToDmsMagnitude(decimal);
  return { degrees, minutes, seconds, direction: decimal < 0 ? 'W' : 'E' };
}

function decimalToDmsMagnitude(decimal: number): { degrees: number; minutes: number; seconds: number } {
  const absolute = Math.abs(decimal);
  let degrees = Math.floor(absolute);
  const minutesFull = (absolute - degrees) * 60;
  let minutes = Math.floor(minutesFull);
  // Rounded to keep display free of floating-point noise (e.g. 59.99999999997),
  // then carried through minutes/degrees in case that rounding reaches 60.
  let seconds = Math.round((minutesFull - minutes) * 60 * 1000) / 1000;
  if (seconds >= 60) {
    seconds -= 60;
    minutes += 1;
  }
  if (minutes >= 60) {
    minutes -= 60;
    degrees += 1;
  }
  return { degrees, minutes, seconds };
}
