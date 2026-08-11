import { describe, expect, it } from 'vitest';
import { CONFIG_STORAGE_KEY, loadConfig, saveConfig } from '../src/storage/config.ts';
import type { AppConfig } from '../src/types.ts';

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length(): number {
    return this.map.size;
  }
  clear(): void {
    this.map.clear();
  }
  getItem(key: string): string | null {
    return this.map.has(key) ? (this.map.get(key) as string) : null;
  }
  key(index: number): string | null {
    return Array.from(this.map.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

const sampleConfig: AppConfig = {
  location: { latitude: 52.52, longitude: 13.405, elevation: 34, timezone: 'Europe/Berlin' },
  calculation: { fajrAngle: 18, ishaAngle: 17, asrMethod: 1 },
  adjustments: {
    minuteOffsets: { fajr: 0, shuruq: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    hijriOffsetDays: 0,
  },
  output: { year: 2027, generator: 'Test Mosque', metaFields: {}, validateSchema: false },
  language: 'de',
};

describe('loadConfig', () => {
  it('reports not-found when nothing is stored', () => {
    const storage = new MemoryStorage();
    expect(loadConfig(storage)).toEqual({ status: 'not-found' });
  });

  it('loads a previously saved, valid config', () => {
    const storage = new MemoryStorage();
    saveConfig(sampleConfig, storage);
    const result = loadConfig(storage);
    expect(result.status).toBe('loaded');
    if (result.status === 'loaded') {
      expect(result.config).toEqual(sampleConfig);
    }
  });

  it('backs up malformed JSON under .bak and clears the original slot', () => {
    const storage = new MemoryStorage();
    storage.setItem(CONFIG_STORAGE_KEY, '{not valid json');
    const result = loadConfig(storage);
    expect(result).toEqual({ status: 'recovered', backupKey: `${CONFIG_STORAGE_KEY}.bak` });
    expect(storage.getItem(`${CONFIG_STORAGE_KEY}.bak`)).toBe('{not valid json');
    expect(storage.getItem(CONFIG_STORAGE_KEY)).toBeNull();
  });

  it('backs up a structurally wrong (but valid JSON) config the same way', () => {
    const storage = new MemoryStorage();
    storage.setItem(CONFIG_STORAGE_KEY, JSON.stringify({ foo: 'bar' }));
    const result = loadConfig(storage);
    expect(result).toEqual({ status: 'recovered', backupKey: `${CONFIG_STORAGE_KEY}.bak` });
  });

  it('numbers subsequent backups when .bak is already taken', () => {
    const storage = new MemoryStorage();
    storage.setItem(`${CONFIG_STORAGE_KEY}.bak`, 'first-corrupt-payload');
    storage.setItem(CONFIG_STORAGE_KEY, 'second-corrupt-payload');
    const result = loadConfig(storage);
    expect(result).toEqual({ status: 'recovered', backupKey: `${CONFIG_STORAGE_KEY}.bak1` });
    expect(storage.getItem(`${CONFIG_STORAGE_KEY}.bak1`)).toBe('second-corrupt-payload');
  });

  it('keeps numbering upward when .bak and .bak1 are both taken', () => {
    const storage = new MemoryStorage();
    storage.setItem(`${CONFIG_STORAGE_KEY}.bak`, 'a');
    storage.setItem(`${CONFIG_STORAGE_KEY}.bak1`, 'b');
    storage.setItem(CONFIG_STORAGE_KEY, 'c');
    const result = loadConfig(storage);
    expect(result).toEqual({ status: 'recovered', backupKey: `${CONFIG_STORAGE_KEY}.bak2` });
  });
});
