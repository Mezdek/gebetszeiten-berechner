/** Names of the six computed prayer times, in the order they occur during a day. */
export type PrayerName = 'fajr' | 'shuruq' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export const PRAYER_NAMES: readonly PrayerName[] = ['fajr', 'shuruq', 'dhuhr', 'asr', 'maghrib', 'isha'];

/** Asr shadow factor: 1 = Shafiʿi/Maliki/Hanbali, 2 = Hanafi. */
export type AsrMethod = 1 | 2;

export type RoundingDirection = 'down' | 'up';

export interface Location {
  /** Decimal degrees, positive north. */
  latitude: number;
  /** Decimal degrees, positive east. */
  longitude: number;
  /** Metres above sea level. */
  elevation: number;
  /** IANA timezone identifier, e.g. "Europe/Berlin". */
  timezone: string;
}

export interface CalculationSettings {
  /** Degrees below the horizon at which Fajr begins. */
  fajrAngle: number;
  /** Degrees below the horizon at which Isha begins. */
  ishaAngle: number;
  asrMethod: AsrMethod;
}

/** Minute offsets applied after rounding, one per prayer. */
export type MinuteOffsets = Record<PrayerName, number>;

export interface Adjustments {
  minuteOffsets: MinuteOffsets;
  /** Days added to the Hijri date computed from the Gregorian date, applied globally. */
  hijriOffsetDays: number;
}

/** Arbitrary operator-supplied key/value pairs copied verbatim into meta. */
export type MetaFields = Record<string, string>;

export interface OutputSettings {
  year: number;
  generator: string;
  metaFields: MetaFields;
  /** Whether to validate the generated document against the output schema before writing it. */
  validateSchema: boolean;
}

export interface AppConfig {
  location: Location;
  calculation: CalculationSettings;
  adjustments: Adjustments;
  output: OutputSettings;
  language: 'de' | 'ar';
}

export interface HijriDate {
  day: number;
  month: number;
  year: number;
}

export interface DayTimes {
  fajr: string;
  shuruq: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  hijri: HijriDate;
}

export interface OutputMeta {
  year: number;
  generatedAt: string;
  generator: string;
  calculation: {
    location: Location;
    calculation: CalculationSettings;
    adjustments: Adjustments;
  };
  [key: string]: unknown;
}

export interface PrayerTimesDocument {
  meta: OutputMeta;
  days: Record<string, DayTimes>;
}
