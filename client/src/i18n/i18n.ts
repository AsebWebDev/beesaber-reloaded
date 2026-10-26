import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import { de } from './de.ts';
import { en } from './en.ts';

/**
 * Which language the app speaks, and the texts for it.
 *
 * The app shows English unless the visitor's browser prefers a language it
 * has, or the visitor picked one, which wins over the browser. English is
 * also what a text falls back to if a language lacks it.
 */

const LANGUAGES = ['en', 'de'] as const;

type Language = (typeof LANGUAGES)[number];

/** Where the visitor's own choice is kept, in this browser only */
const STORAGE_KEY = 'beesaber.language';

const isLanguage = (value: unknown): value is Language =>
  LANGUAGES.includes(value as Language);

/** The language picked in this browser before, if any */
const storedLanguage = (): Language | undefined => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    return isLanguage(stored) ? stored : undefined;
  } catch {
    // Storage can be switched off or full; the browser's language will do
    return undefined;
  }
};

/**
 * The first of the browser's languages the app has. Only the language
 * counts, not the region: "de-AT" and "de-CH" both get German.
 */
const browserLanguage = (
  preferred: readonly string[] = navigator.languages
): Language | undefined =>
  preferred
    .map((tag) => tag.split('-')[0]?.toLowerCase())
    .find((language) => isLanguage(language));

const detectLanguage = (): Language =>
  storedLanguage() ?? browserLanguage() ?? 'en';

const i18n = i18next.createInstance();

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, de: { translation: de } },
  lng: detectLanguage(),
  fallbackLng: 'en',
  // The texts are part of the bundle, so they are there at once. Without
  // this, the first render would happen before i18next is ready.
  initAsync: false,
  // React escapes whatever it puts into the page already
  interpolation: { escapeValue: false },
});

/**
 * The page says which language it is in. A screen reader picks its voice
 * by it, and the browser its hyphenation and its offer to translate.
 */
const markPageLanguage = (language: string) => {
  document.documentElement.lang = language;
};

markPageLanguage(i18n.language);
i18n.on('languageChanged', markPageLanguage);

/** The language the app shows right now */
const currentLanguage = (): Language =>
  isLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : 'en';

/** Switches the app to a language and remembers the choice in the browser */
const setLanguage = async (language: Language) => {
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Not remembered, but still switched for this visit
  }

  await i18n.changeLanguage(language);
};

export {
  browserLanguage,
  currentLanguage,
  detectLanguage,
  i18n,
  LANGUAGES,
  setLanguage,
};
export type { Language };
