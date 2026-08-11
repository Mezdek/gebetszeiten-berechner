export interface Messages {
  appTitle: string;
  langSwitcherLabel: string;
  langDe: string;
  langAr: string;

  sectionLocation: string;
  sectionCalculation: string;
  sectionAdjustments: string;
  sectionOutput: string;
  sectionRounding: string;

  fieldLatitude: string;
  fieldLongitude: string;
  fieldElevation: string;
  fieldElevationHint: string;
  fieldTimezone: string;
  fieldTimezoneHint: string;

  fieldFajrAngle: string;
  fieldIshaAngle: string;
  fieldAsrMethod: string;
  asrMethodShafii: string;
  asrMethodHanafi: string;

  fieldMinuteOffset: string;
  fieldHijriOffset: string;
  fieldHijriOffsetHint: string;

  fieldYear: string;
  fieldGenerator: string;
  fieldMetaFields: string;
  metaKeyPlaceholder: string;
  metaValuePlaceholder: string;
  addMetaField: string;
  removeMetaField: string;
  fieldValidateSchema: string;
  fieldValidateSchemaHint: string;

  prayerFajr: string;
  prayerShuruq: string;
  prayerDhuhr: string;
  prayerAsr: string;
  prayerMaghrib: string;
  prayerIsha: string;

  roundingDown: string;
  roundingUp: string;

  generateButton: string;
  generating: string;
  generateSuccess: string;
  generateCancelled: string;
  generateValidationFailedTitle: string;
  generateValidationFailedIntro: string;

  configNotFound: string;
  configLoaded: string;
  configRecovered: string;

  exportConfig: string;
  importConfig: string;
  importSuccess: string;
  importFailedParse: string;
  importFailedShape: string;

  errorLatitude: string;
  errorLongitude: string;
  errorElevation: string;
  errorTimezoneRequired: string;
  errorTimezoneUnknown: string;
  errorDepressionAngle: string;
  errorHijriOffset: string;
  errorMinuteOffset: string;
  errorYear: string;
  errorGeneratorRequired: string;
  errorMetaKeyRequired: string;
  errorFixBeforeGenerate: string;

  saved: string;
}

export type MessageKey = keyof Messages;
