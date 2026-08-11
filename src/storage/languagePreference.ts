import type { Language } from '../i18n/index.ts';

const LANGUAGE_STORAGE_KEY = 'gebetszeiten-berechner:language';

/**
 * The UI language preference is persisted separately from the operator's
 * AppConfig: it is a display setting the operator picks from the dropdown,
 * not a domain value tied to a specific location/calculation setup, so
 * loading or importing a config must not silently flip the active language.
 */
export function loadLanguagePreference(storage: Storage = localStorage): Language | null {
  const value = storage.getItem(LANGUAGE_STORAGE_KEY);
  return value === 'de' || value === 'ar' ? value : null;
}

export function saveLanguagePreference(language: Language, storage: Storage = localStorage): void {
  storage.setItem(LANGUAGE_STORAGE_KEY, language);
}
