import { describe, expect, it } from 'vitest';
import { loadLanguagePreference, saveLanguagePreference } from '../src/storage/languagePreference.ts';

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

describe('language preference persistence', () => {
  it('returns null when nothing has been stored', () => {
    expect(loadLanguagePreference(new MemoryStorage())).toBeNull();
  });

  it('round-trips a saved language', () => {
    const storage = new MemoryStorage();
    saveLanguagePreference('ar', storage);
    expect(loadLanguagePreference(storage)).toBe('ar');
  });

  it('ignores a corrupt/unexpected stored value', () => {
    const storage = new MemoryStorage();
    storage.setItem('gebetszeiten-berechner:language', 'fr');
    expect(loadLanguagePreference(storage)).toBeNull();
  });
});
