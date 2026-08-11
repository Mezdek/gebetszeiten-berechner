import type { Messages, MessageKey } from './messages.ts';
import { de } from './de.ts';
import { ar } from './ar.ts';

export type Language = 'de' | 'ar';

export const LANGUAGES: readonly Language[] = ['de', 'ar'];

const catalogs: Record<Language, Messages> = { de, ar };

export function isRtl(language: Language): boolean {
  return language === 'ar';
}

export function translate(language: Language, key: MessageKey, vars?: Record<string, string>): string {
  let text: string = catalogs[language][key];
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, value);
    }
  }
  return text;
}
