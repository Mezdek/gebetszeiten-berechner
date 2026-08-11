import { describe, expect, it } from 'vitest';
import { commitOutputFilename, peekOutputFilename } from '../src/output/filename.ts';

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

describe('output filename deduplication', () => {
  it('starts with the plain filename, then numbers subsequent productions', () => {
    const storage = new MemoryStorage();
    expect(peekOutputFilename(2027, storage)).toBe('prayer_times_2027.json');
    commitOutputFilename(2027, storage);

    expect(peekOutputFilename(2027, storage)).toBe('prayer_times_2027(1).json');
    commitOutputFilename(2027, storage);

    expect(peekOutputFilename(2027, storage)).toBe('prayer_times_2027(2).json');
  });

  it('tracks each year independently', () => {
    const storage = new MemoryStorage();
    commitOutputFilename(2027, storage);
    expect(peekOutputFilename(2028, storage)).toBe('prayer_times_2028.json');
  });

  it('does not advance the counter until committed', () => {
    const storage = new MemoryStorage();
    expect(peekOutputFilename(2027, storage)).toBe('prayer_times_2027.json');
    expect(peekOutputFilename(2027, storage)).toBe('prayer_times_2027.json');
  });
});
