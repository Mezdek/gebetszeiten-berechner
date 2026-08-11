/**
 * UTC offset, in minutes, of an IANA timezone at a given UTC instant.
 *
 * Computed by formatting the instant's wall-clock representation in the
 * target zone and comparing it against the instant itself — this uses only
 * the browser's built-in `Intl` timezone database (no timezone library) and
 * correctly reflects whichever DST rule is in effect at that instant.
 */
export function utcOffsetMinutesAt(timeZone: string, utcInstant: Date): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = Object.fromEntries(formatter.formatToParts(utcInstant).map((p) => [p.type, p.value]));
  const wallClockAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  );
  return Math.round((wallClockAsUtc - utcInstant.getTime()) / 60000);
}

/**
 * UTC offset, in minutes, that governs a given local calendar date in
 * `timeZone`. Anchored at UTC noon of that calendar date: for every real
 * IANA zone the DST transition instant itself falls in the early hours of
 * the local day, so this anchor always lands outside the transition and
 * yields the one offset that applies to that date's daytime prayer times.
 */
export function utcOffsetMinutesForDate(timeZone: string, year: number, month: number, day: number): number {
  const anchor = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return utcOffsetMinutesAt(timeZone, anchor);
}

/** Validates that a string is a timezone identifier the runtime recognizes. */
export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}
