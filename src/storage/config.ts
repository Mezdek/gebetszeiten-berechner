import type { AppConfig } from '../types.ts';
import { PRAYER_NAMES } from '../types.ts';

export const CONFIG_STORAGE_KEY = 'gebetszeiten-berechner:config';

export type ConfigLoadResult =
  | { status: 'not-found' }
  | { status: 'loaded'; config: AppConfig }
  | { status: 'recovered'; backupKey: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Structural validation only — catches corruption, not out-of-range values (the form validates those live). */
export function isValidConfig(value: unknown): value is AppConfig {
  if (!isRecord(value)) return false;

  const location = value.location;
  if (!isRecord(location)) return false;
  if (
    typeof location.latitude !== 'number' ||
    typeof location.longitude !== 'number' ||
    typeof location.elevation !== 'number' ||
    typeof location.timezone !== 'string'
  ) {
    return false;
  }

  const calculation = value.calculation;
  if (!isRecord(calculation)) return false;
  if (
    typeof calculation.fajrAngle !== 'number' ||
    typeof calculation.ishaAngle !== 'number' ||
    (calculation.asrMethod !== 1 && calculation.asrMethod !== 2)
  ) {
    return false;
  }

  const adjustments = value.adjustments;
  if (!isRecord(adjustments)) return false;
  if (typeof adjustments.hijriOffsetDays !== 'number') return false;
  const minuteOffsets = adjustments.minuteOffsets;
  if (!isRecord(minuteOffsets)) return false;
  for (const prayer of PRAYER_NAMES) {
    if (typeof minuteOffsets[prayer] !== 'number') return false;
  }

  const output = value.output;
  if (!isRecord(output)) return false;
  if (
    typeof output.year !== 'number' ||
    typeof output.generator !== 'string' ||
    typeof output.validateSchema !== 'boolean' ||
    !isRecord(output.metaFields)
  ) {
    return false;
  }
  for (const v of Object.values(output.metaFields)) {
    if (typeof v !== 'string') return false;
  }

  if (value.language !== 'de' && value.language !== 'ar') return false;

  return true;
}

function nextBackupKey(storage: Storage): string {
  if (storage.getItem(`${CONFIG_STORAGE_KEY}.bak`) === null) return `${CONFIG_STORAGE_KEY}.bak`;
  let n = 1;
  while (storage.getItem(`${CONFIG_STORAGE_KEY}.bak${n}`) !== null) n++;
  return `${CONFIG_STORAGE_KEY}.bak${n}`;
}

/**
 * Loads the persisted configuration.
 *  - Not found: the operator fills the form.
 *  - Found and valid: returned as-is.
 *  - Found and malformed: preserved under a numbered `.bak` key rather than
 *    discarded, and the original slot is cleared for a fresh save.
 */
export function loadConfig(storage: Storage = localStorage): ConfigLoadResult {
  const raw = storage.getItem(CONFIG_STORAGE_KEY);
  if (raw === null) return { status: 'not-found' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = undefined;
  }

  if (parsed !== undefined && isValidConfig(parsed)) {
    return { status: 'loaded', config: parsed };
  }

  const backupKey = nextBackupKey(storage);
  storage.setItem(backupKey, raw);
  storage.removeItem(CONFIG_STORAGE_KEY);
  return { status: 'recovered', backupKey };
}

export function saveConfig(config: AppConfig, storage: Storage = localStorage): void {
  storage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
}
