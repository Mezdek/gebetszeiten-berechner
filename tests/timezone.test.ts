import { describe, expect, it } from 'vitest';
import { utcOffsetMinutesForDate } from '../src/core/timezone.ts';
import { datesInYear } from '../src/core/year.ts';

describe('utcOffsetMinutesForDate — Europe/Berlin, 2027 (crosses both DST transitions)', () => {
  it('is CET (+60) in January and CEST (+120) in July', () => {
    expect(utcOffsetMinutesForDate('Europe/Berlin', 2027, 1, 15)).toBe(60);
    expect(utcOffsetMinutesForDate('Europe/Berlin', 2027, 7, 15)).toBe(120);
  });

  it('changes offset exactly twice across the full year, each time by 60 minutes', () => {
    let previous = utcOffsetMinutesForDate('Europe/Berlin', 2027, 1, 1);
    const changes: { date: string; from: number; to: number }[] = [];
    for (const { year, month, day } of datesInYear(2027)) {
      const offset = utcOffsetMinutesForDate('Europe/Berlin', year, month, day);
      if (offset !== previous) {
        changes.push({ date: `${year}-${month}-${day}`, from: previous, to: offset });
        previous = offset;
      }
    }
    expect(changes).toHaveLength(2);
    expect(changes[0]).toMatchObject({ from: 60, to: 120 }); // spring forward, late March
    expect(changes[1]).toMatchObject({ from: 120, to: 60 }); // fall back, late October
    expect(changes[0]?.date.startsWith('2027-3-')).toBe(true);
    expect(changes[1]?.date.startsWith('2027-10-')).toBe(true);
  });

  it('has no DST in a fixed-offset zone', () => {
    const jan = utcOffsetMinutesForDate('Asia/Kolkata', 2027, 1, 15);
    const jul = utcOffsetMinutesForDate('Asia/Kolkata', 2027, 7, 15);
    expect(jan).toBe(330);
    expect(jul).toBe(330);
  });
});
