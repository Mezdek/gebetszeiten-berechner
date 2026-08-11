import type { AppConfig, PrayerTimesDocument } from '../types.ts';
import { buildOutputDocument } from './document.ts';
import { validateOutputDocument, type SchemaFailure } from './schema.ts';
import { peekOutputFilename, commitOutputFilename } from './filename.ts';
import { downloadJsonFile } from './download.ts';

export class OutputValidationError extends Error {
  readonly failures: SchemaFailure[];

  constructor(failures: SchemaFailure[]) {
    super('Generated document failed validation.');
    this.name = 'OutputValidationError';
    this.failures = failures;
  }
}

export interface GenerateResult {
  filename: string;
  document: PrayerTimesDocument;
}

/**
 * Builds the year's prayer time document, optionally validates it, and
 * triggers the browser download. The filename counter is only advanced
 * after the download call succeeds, so a cancelled save dialog does not
 * burn a `(n)` suffix.
 */
export async function generateAndDownload(config: AppConfig, storage: Storage = localStorage): Promise<GenerateResult> {
  const document = buildOutputDocument(config, new Date().toISOString());

  if (config.output.validateSchema) {
    const failures = validateOutputDocument(document, config.output.year);
    if (failures.length > 0) {
      throw new OutputValidationError(failures);
    }
  }

  const filename = peekOutputFilename(config.output.year, storage);
  const contents = JSON.stringify(document, null, 2);
  await downloadJsonFile(filename, contents);
  commitOutputFilename(config.output.year, storage);

  return { filename, document };
}
