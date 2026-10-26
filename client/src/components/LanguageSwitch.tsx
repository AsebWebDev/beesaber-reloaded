import { useTranslation } from 'react-i18next';

import { currentLanguage, LANGUAGES, setLanguage } from '@/i18n/i18n.ts';

import type { Language } from '@/i18n/i18n.ts';

/**
 * Each language by its own name, the way someone who speaks it looks for
 * it: a German speaker stuck on an English page looks for "Deutsch", not
 * for "German".
 */
const NAMES: Record<Language, string> = {
  de: 'Deutsch',
  en: 'English',
};

/**
 * Buttons to switch the app's language. The choice is kept in this browser
 * and wins over the browser's own language from then on.
 */
const LanguageSwitch = () => {
  // Draws again when the language changes, so the pressed button follows
  const { t } = useTranslation();
  const current = currentLanguage();

  return (
    <div
      role="group"
      aria-label={t('language.label')}
      className="flex flex-wrap gap-2"
    >
      {LANGUAGES.map((language) => (
        <button
          key={language}
          type="button"
          // A screen reader reads "Deutsch" with a German voice, also on an
          // English page
          lang={language}
          aria-pressed={current === language}
          onClick={() => void setLanguage(language)}
          className={`cursor-pointer rounded-full border px-3 py-1 text-sm transition ${
            current === language
              ? 'border-neon-blue bg-neon-blue text-white'
              : 'border-night-control text-slate-300 hover:border-slate-300'
          }`}
        >
          {NAMES[language]}
        </button>
      ))}
    </div>
  );
};

export { LanguageSwitch };
