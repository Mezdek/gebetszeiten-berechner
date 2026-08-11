import type { AppConfig } from '../types.ts';
import { isValidConfig } from './config.ts';

export function serializeConfigForExport(config: AppConfig): string {
  return JSON.stringify(config, null, 2);
}

export class InvalidConfigFileError extends Error {
  constructor(reason: 'parse' | 'shape') {
    super(reason === 'parse' ? 'The file is not valid JSON.' : 'The file does not contain a valid configuration.');
    this.name = 'InvalidConfigFileError';
  }
}

export function parseImportedConfig(text: string): AppConfig {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new InvalidConfigFileError('parse');
  }
  if (!isValidConfig(parsed)) {
    throw new InvalidConfigFileError('shape');
  }
  return parsed;
}
