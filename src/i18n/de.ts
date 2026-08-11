import type { Messages } from './messages.ts';

export const de: Messages = {
  appTitle: 'Gebetszeiten-Berechner',
  langSwitcherLabel: 'Sprache',
  langDe: 'Deutsch',
  langAr: 'العربية',

  sectionLocation: 'Standort',
  sectionCalculation: 'Berechnung',
  sectionAdjustments: 'Anpassungen',
  sectionOutput: 'Ausgabe',
  sectionRounding: 'Rundung',

  fieldLatitude: 'Breitengrad',
  fieldLongitude: 'Längengrad',
  fieldElevation: 'Höhe über dem Meeresspiegel (m)',
  fieldElevationHint: 'Leer lassen für 0 m.',
  fieldTimezone: 'Zeitzone (IANA, z. B. Europe/Berlin)',
  fieldTimezoneHint: 'Wird nicht aus dem Browser übernommen – bitte angeben.',

  fieldFajrAngle: 'Fajr-Winkel (Grad unter dem Horizont)',
  fieldIshaAngle: 'Isha-Winkel (Grad unter dem Horizont)',
  fieldAsrMethod: 'Asr-Methode',
  asrMethodShafii: 'Schafiitisch/Hanbalitisch (Standard, Faktor 1)',
  asrMethodHanafi: 'Hanafitisch (Faktor 2)',

  fieldMinuteOffset: 'Minuten-Offset',
  fieldHijriOffset: 'Hijri-Datumsversatz (Tage)',
  fieldHijriOffsetHint: 'Gilt global für jedes Datum, zwischen −2 und +2.',

  fieldYear: 'Jahr',
  fieldGenerator: 'Name des Erstellers',
  fieldMetaFields: 'Weitere Metadaten',
  metaKeyPlaceholder: 'Feldname (z. B. Adresse)',
  metaValuePlaceholder: 'Wert',
  addMetaField: 'Feld hinzufügen',
  removeMetaField: 'Entfernen',
  fieldValidateSchema: 'Ausgabe vor dem Schreiben validieren',
  fieldValidateSchemaHint: 'Standardmäßig deaktiviert. Bei einem Validierungsfehler wird keine Datei geschrieben.',

  prayerFajr: 'Fajr',
  prayerShuruq: 'Shuruq',
  prayerDhuhr: 'Dhuhr',
  prayerAsr: 'Asr',
  prayerMaghrib: 'Maghrib',
  prayerIsha: 'Isha',

  roundingDown: 'wird abgerundet – die angesagte Zeit liegt bis zu eine Minute vor der berechneten Zeit',
  roundingUp: 'wird aufgerundet – die angesagte Zeit liegt bis zu eine Minute nach der berechneten Zeit',

  generateButton: 'Gebetszeiten erzeugen',
  generating: 'Wird erzeugt …',
  generateSuccess: 'Datei „{filename}“ wurde erzeugt.',
  generateCancelled: 'Speichern wurde abgebrochen.',
  generateValidationFailedTitle: 'Validierung fehlgeschlagen',
  generateValidationFailedIntro:
    'Dies ist ein Fehler in dieser Anwendung, kein Bedienfehler. Es wurde keine Datei geschrieben. Betroffene Regeln:',

  configNotFound: 'Keine gespeicherte Konfiguration gefunden. Bitte Formular ausfüllen.',
  configLoaded: 'Gespeicherte Konfiguration geladen.',
  configRecovered:
    'Die gespeicherte Konfiguration war beschädigt und wurde unter „{backupKey}“ gesichert. Bitte Formular neu ausfüllen.',

  exportConfig: 'Konfiguration exportieren',
  importConfig: 'Konfiguration importieren',
  importSuccess: 'Konfiguration importiert.',
  importFailedParse: 'Die Datei enthält kein gültiges JSON.',
  importFailedShape: 'Die Datei enthält keine gültige Konfiguration.',

  errorLatitude: 'Breitengrad muss zwischen −90 und 90 liegen.',
  errorLongitude: 'Längengrad muss zwischen −180 und 180 liegen.',
  errorElevation: 'Höhe muss zwischen 0 und 9000 m liegen.',
  errorTimezoneRequired: 'Zeitzone ist erforderlich.',
  errorTimezoneUnknown: 'Unbekannte Zeitzone.',
  errorDepressionAngle: 'Winkel muss zwischen 2° und 30° liegen.',
  errorHijriOffset: 'Hijri-Versatz muss eine ganze Zahl zwischen −2 und 2 sein.',
  errorMinuteOffset: 'Minuten-Offset muss eine ganze Zahl zwischen −60 und 60 sein.',
  errorYear: 'Bitte ein gültiges Jahr angeben.',
  errorGeneratorRequired: 'Name des Erstellers ist erforderlich.',
  errorMetaKeyRequired: 'Feldname darf nicht leer sein.',
  errorFixBeforeGenerate: 'Bitte die markierten Felder korrigieren, bevor die Datei erzeugt wird.',

  saved: 'Gespeichert.',
};
