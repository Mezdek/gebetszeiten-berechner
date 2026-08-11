const COUNT_KEY_PREFIX = 'gebetszeiten-berechner:download-count:';

function countKey(year: number): string {
  return `${COUNT_KEY_PREFIX}${year}`;
}

function filenameForCount(year: number, count: number): string {
  return count === 0 ? `prayer_times_${year}.json` : `prayer_times_${year}(${count}).json`;
}

/** Filename that would be used if a file were produced right now, without reserving it. */
export function peekOutputFilename(year: number, storage: Storage = localStorage): string {
  const count = Number(storage.getItem(countKey(year)) ?? '0');
  return filenameForCount(year, count);
}

/** Marks the current filename as produced, so the next call advances to the next `(n)` suffix. */
export function commitOutputFilename(year: number, storage: Storage = localStorage): void {
  const count = Number(storage.getItem(countKey(year)) ?? '0');
  storage.setItem(countKey(year), String(count + 1));
}
