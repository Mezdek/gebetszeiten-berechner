import { describe, expect, it } from 'vitest';
import { formatMinutesOfDay, roundMinutes } from '../src/core/rounding.ts';

describe('roundMinutes', () => {
  it('rounds down at a boundary just above a whole minute', () => {
    expect(roundMinutes(134.999, 'down')).toBe(134);
  });

  it('rounds down an exact whole minute to itself', () => {
    expect(roundMinutes(134.0, 'down')).toBe(134);
  });

  it('rounds up at a boundary just above a whole minute', () => {
    expect(roundMinutes(134.001, 'up')).toBe(135);
  });

  it('rounds up an exact whole minute to itself', () => {
    expect(roundMinutes(134.0, 'up')).toBe(134);
  });
});

describe('formatMinutesOfDay', () => {
  it('formats a normal time', () => {
    expect(formatMinutesOfDay(134)).toBe('02:14');
  });

  it('wraps a value at or beyond 1440 back to the start of day', () => {
    expect(formatMinutesOfDay(1440)).toBe('00:00');
    expect(formatMinutesOfDay(1454)).toBe('00:14');
  });

  it('wraps a negative value to the end of the previous day', () => {
    expect(formatMinutesOfDay(-1)).toBe('23:59');
  });
});

describe('offset is applied strictly after rounding', () => {
  it('rounds first, then adds the operator offset, for a down-rounded prayer', () => {
    const exact = 134.7;
    const rounded = roundMinutes(exact, 'down');
    expect(rounded).toBe(134); // not 135 — the .7 must not leak through
    const final = rounded + 5;
    expect(formatMinutesOfDay(final)).toBe('02:19');
  });

  it('rounds first, then adds the operator offset, for an up-rounded prayer', () => {
    const exact = 134.1;
    const rounded = roundMinutes(exact, 'up');
    expect(rounded).toBe(135); // not 134 — even a hair past the minute rounds up
    const final = rounded - 10;
    expect(formatMinutesOfDay(final)).toBe('02:05');
  });
});
