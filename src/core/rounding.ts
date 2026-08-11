import type { RoundingDirection } from '../types.ts';

/** Rounds a fractional minute-of-day value to a whole minute, in the given direction. */
export function roundMinutes(exactMinutes: number, direction: RoundingDirection): number {
  return direction === 'down' ? Math.floor(exactMinutes) : Math.ceil(exactMinutes);
}

/** Formats a (possibly negative or ≥1440) minute-of-day count as local wall-clock "HH:mm". */
export function formatMinutesOfDay(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hh = Math.floor(normalized / 60);
  const mm = normalized % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}
