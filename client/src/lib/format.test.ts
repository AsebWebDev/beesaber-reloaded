import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { i18n } from '@/i18n/i18n.ts';

import {
  countryFlag,
  difficultyName,
  formatAccuracy,
  formatDelta,
  formatRank,
  formatScore,
  timeAgo,
} from './format.ts';

describe('difficultyName', () => {
  it('names the five difficulties ScoreSaber knows', () => {
    expect([1, 3, 5, 7, 9].map(difficultyName)).toEqual([
      'Easy',
      'Normal',
      'Hard',
      'Expert',
      'Expert+',
    ]);
  });

  it('still shows something for a number it does not know', () => {
    expect(difficultyName(11)).toBe('Level 11');
  });
});

describe('formatScore', () => {
  it('groups the digits', () => {
    expect(formatScore(1234567)).toBe('1,234,567');
    expect(formatScore(0)).toBe('0');
  });
});

describe('formatAccuracy', () => {
  it('turns a fraction into a percentage', () => {
    expect(formatAccuracy(0.9785)).toBe('97.85%');
    expect(formatAccuracy(1)).toBe('100.00%');
  });

  it('shows a dash when ScoreSaber has no accuracy for the score', () => {
    expect(formatAccuracy(0)).toBe('–');
  });
});

describe('formatRank', () => {
  it('shows the rank', () => {
    expect(formatRank(9024)).toBe('Rank #9,024');
  });

  it('calls a player without a rank unranked', () => {
    expect(formatRank(0)).toBe('Unranked');
  });
});

describe('formatDelta', () => {
  it('always shows a sign', () => {
    expect(formatDelta(1500)).toBe('+1,500');
    expect(formatDelta(-20)).toBe('−20');
    expect(formatDelta(0)).toBe('±0');
  });
});

describe('timeAgo', () => {
  const now = new Date('2024-06-15T12:00:00.000Z');

  it('picks the largest unit that fits', () => {
    expect(timeAgo('2024-06-15T11:30:00.000Z', now)).toBe('30 minutes ago');
    expect(timeAgo('2024-06-15T09:00:00.000Z', now)).toBe('3 hours ago');
    expect(timeAgo('2024-06-12T12:00:00.000Z', now)).toBe('3 days ago');
    expect(timeAgo('2024-03-15T12:00:00.000Z', now)).toBe('3 months ago');
    expect(timeAgo('2021-06-15T12:00:00.000Z', now)).toBe('3 years ago');
  });

  it('uses words where there is one', () => {
    expect(timeAgo('2024-06-14T12:00:00.000Z', now)).toBe('yesterday');
  });

  it('says "now" for the last minute', () => {
    expect(timeAgo('2024-06-15T11:59:30.000Z', now)).toBe('now');
  });
});

describe('countryFlag', () => {
  it('turns a country code into its flag', () => {
    expect(countryFlag('DE')).toBe('🇩🇪');
    expect(countryFlag('us')).toBe('🇺🇸');
  });

  it('returns nothing for something that is not a country code', () => {
    expect(countryFlag('')).toBe('');
    expect(countryFlag('GER')).toBe('');
  });
});

describe('in German', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('de');
  });

  afterEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('groups digits with dots', () => {
    expect(formatScore(1234567)).toBe('1.234.567');
    expect(formatDelta(-1500)).toBe('−1.500');
  });

  it('writes percentages with a comma and a space', () => {
    // A narrow no-break space between number and sign, as German writes it
    expect(formatAccuracy(0.9785)).toMatch(/^97,85\s%$/u);
  });

  it('says rank and time in German', () => {
    const now = new Date('2024-06-15T12:00:00.000Z');

    expect(formatRank(9024)).toBe('Rang 9.024');
    expect(formatRank(0)).toBe('Ohne Rang');
    expect(timeAgo('2024-06-12T12:00:00.000Z', now)).toBe('vor 3 Tagen');
    expect(timeAgo('2024-06-14T12:00:00.000Z', now)).toBe('gestern');
    expect(timeAgo('2024-06-15T11:59:30.000Z', now)).toBe('gerade eben');
  });

  it('keeps the names of the difficulties as players know them', () => {
    expect(difficultyName(9)).toBe('Expert+');
  });
});
