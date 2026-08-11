import type { AppConfig, OutputMeta, PrayerTimesDocument } from '../types.ts';
import { generateYearDays } from '../core/year.ts';

export function buildOutputDocument(config: AppConfig, generatedAtIso: string): PrayerTimesDocument {
  const days = generateYearDays(
    config.output.year,
    config.location,
    config.calculation,
    config.adjustments.minuteOffsets,
    config.adjustments.hijriOffsetDays,
  );

  const meta: OutputMeta = {
    ...config.output.metaFields,
    year: config.output.year,
    generatedAt: generatedAtIso,
    generator: config.output.generator,
    calculation: {
      location: config.location,
      calculation: config.calculation,
      adjustments: config.adjustments,
    },
  };

  return { meta, days };
}
