import { currentLocale, i18n } from '@/i18n/i18n.ts';

/**
 * Numbers, ranks and times as text, in the way of writing of the language
 * the app shows: "1,234,567" in English, "1.234.567" in German. Where the
 * browser's region writes the same language differently, its way wins:
 * "25/10/2026" in Britain, "1'234'567" in Switzerland.
 *
 * Each function asks which language is current when it is called. A page
 * draws itself again when the language changes (it asks for its texts with
 * useTranslation), and calls these anew.
 */

// The names Beat Saber and ScoreSaber use, in every language: players know
// the difficulties by these, whatever language their game is in
const DIFFICULTIES: Record<number, string> = {
  1: 'Easy',
  3: 'Normal',
  5: 'Hard',
  7: 'Expert',
  9: 'Expert+',
};

/** ScoreSaber numbers the difficulties 1, 3, 5, 7, 9 */
const difficultyName = (difficulty: number): string =>
  DIFFICULTIES[difficulty] ?? `Level ${difficulty}`;

/**
 * Builds a formatter once per locale and keeps it. Making an Intl
 * formatter is slow next to using one, and a table calls these for every
 * row.
 */
const perLocale = <Formatter>(make: (locale: string) => Formatter) => {
  const made = new Map<string, Formatter>();

  return () => {
    const locale = currentLocale();
    let formatter = made.get(locale);

    if (formatter === undefined) {
      formatter = make(locale);
      made.set(locale, formatter);
    }

    return formatter;
  };
};

const numbers = perLocale((locale) => new Intl.NumberFormat(locale));
const percentages = perLocale(
  (locale) =>
    new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
);
const relativeTimes = perLocale(
  (locale) => new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
);

/** 1234567 → "1,234,567" */
const formatScore = (score: number): string => numbers().format(score);

/**
 * 0.9785 → "97.85%". ScoreSaber reports 0 for old scores it has no
 * accuracy for; those show as a dash instead of a misleading "0.00%".
 */
const formatAccuracy = (accuracy: number): string =>
  accuracy > 0 ? percentages().format(accuracy) : '–';

/** 38 → "Rank #38". ScoreSaber gives inactive players the rank 0. */
const formatRank = (rank: number): string =>
  rank > 0
    ? i18n.t('format.rank', { rank: numbers().format(rank) })
    : i18n.t('format.unranked');

/** A difference with its sign: 1500 → "+1,500", -20 → "−20" */
const formatDelta = (delta: number): string => {
  if (delta === 0) return '±0';

  return `${delta > 0 ? '+' : '−'}${numbers().format(Math.abs(delta))}`;
};

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 60 * 60 * 1000],
  ['month', 30 * 24 * 60 * 60 * 1000],
  ['day', 24 * 60 * 60 * 1000],
  ['hour', 60 * 60 * 1000],
  ['minute', 60 * 1000],
];

/** "3 days ago", "last year", "now" */
const timeAgo = (date: Date | string, now: Date = new Date()): string => {
  const elapsed = new Date(date).getTime() - now.getTime();

  for (const [unit, ms] of UNITS)
    if (Math.abs(elapsed) >= ms)
      return relativeTimes().format(Math.round(elapsed / ms), unit);

  return i18n.t('format.now');
};

/** The full date and time, for a tooltip: "10/25/2026, 2:05:28 PM" */
const formatDateTime = (date: Date | string): string =>
  new Date(date).toLocaleString(currentLocale());

/** "DE" → 🇩🇪. A flag emoji is the two letters as regional indicators. */
const countryFlag = (countryCode: string): string =>
  /^[A-Za-z]{2}$/.test(countryCode)
    ? String.fromCodePoint(
        ...[...countryCode.toUpperCase()].map(
          (letter) => 0x1f1e6 + letter.charCodeAt(0) - 65
        )
      )
    : '';

export {
  countryFlag,
  difficultyName,
  formatAccuracy,
  formatDateTime,
  formatDelta,
  formatRank,
  formatScore,
  timeAgo,
};
