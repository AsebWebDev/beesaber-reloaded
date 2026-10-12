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

const numberFormat = new Intl.NumberFormat('en');

/** 1234567 → "1,234,567" */
const formatScore = (score: number): string => numberFormat.format(score);

/**
 * 0.9785 → "97.85%". ScoreSaber reports 0 for old scores it has no
 * accuracy for; those show as a dash instead of a misleading "0.00%".
 */
const formatAccuracy = (accuracy: number): string =>
  accuracy > 0 ? `${(accuracy * 100).toFixed(2)}%` : '–';

/** 38 → "Rank #38". ScoreSaber gives inactive players the rank 0. */
const formatRank = (rank: number): string =>
  rank > 0 ? `Rank #${numberFormat.format(rank)}` : 'Unranked';

/** A difference with its sign: 1500 → "+1,500", -20 → "−20" */
const formatDelta = (delta: number): string => {
  if (delta === 0) return '±0';

  return `${delta > 0 ? '+' : '−'}${numberFormat.format(Math.abs(delta))}`;
};

const relativeTime = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

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
      return relativeTime.format(Math.round(elapsed / ms), unit);

  return 'now';
};

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
  formatDelta,
  formatRank,
  formatScore,
  timeAgo,
};
