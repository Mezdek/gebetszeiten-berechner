import type { PrayerTimesDocument } from '../types.ts';
import { PRAYER_NAMES } from '../types.ts';
import { daysInGregorianYear } from '../core/julian.ts';

export interface SchemaFailure {
  rule: string;
  detail: string;
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Validates a generated document against the documented output structure.
 * A failure here means this application produced a malformed document, not
 * that the operator supplied bad input — the caller should say so.
 */
export function validateOutputDocument(doc: PrayerTimesDocument, expectedYear: number): SchemaFailure[] {
  const failures: SchemaFailure[] = [];

  if (doc.meta.year !== expectedYear) {
    failures.push({ rule: 'meta.year', detail: `expected ${expectedYear}, got ${doc.meta.year}` });
  }
  if (typeof doc.meta.generatedAt !== 'string' || Number.isNaN(Date.parse(doc.meta.generatedAt))) {
    failures.push({ rule: 'meta.generatedAt', detail: 'must be a valid ISO timestamp' });
  }
  if (typeof doc.meta.generator !== 'string' || doc.meta.generator.length === 0) {
    failures.push({ rule: 'meta.generator', detail: 'must be a non-empty string' });
  }

  const expectedCount = daysInGregorianYear(expectedYear);
  const keys = Object.keys(doc.days);
  if (keys.length !== expectedCount) {
    failures.push({ rule: 'days.count', detail: `expected ${expectedCount} days, got ${keys.length}` });
  }

  const seenDates = new Set<string>();
  for (const key of keys) {
    const match = DATE_PATTERN.exec(key);
    if (!match) {
      failures.push({ rule: 'days.key.format', detail: `"${key}" is not an ISO date` });
      continue;
    }
    const year = Number(match[1]);
    if (year !== expectedYear) {
      failures.push({ rule: 'days.key.year', detail: `"${key}" is not in ${expectedYear}` });
    }
    seenDates.add(key);

    const day = doc.days[key];
    if (!day) continue;
    for (const prayer of PRAYER_NAMES) {
      const value = day[prayer];
      if (!TIME_PATTERN.test(value)) {
        failures.push({ rule: `days["${key}"].${prayer}`, detail: `"${value}" is not a valid HH:mm time` });
      }
    }
    const hijri = day.hijri;
    if (
      !hijri ||
      !Number.isInteger(hijri.day) ||
      hijri.day < 1 ||
      hijri.day > 30 ||
      !Number.isInteger(hijri.month) ||
      hijri.month < 1 ||
      hijri.month > 12 ||
      !Number.isInteger(hijri.year) ||
      hijri.year < 1
    ) {
      failures.push({ rule: `days["${key}"].hijri`, detail: 'must be a valid Hijri day/month/year' });
    }
  }

  if (seenDates.size !== keys.length) {
    failures.push({ rule: 'days.key.unique', detail: 'duplicate date keys' });
  }

  return failures;
}
