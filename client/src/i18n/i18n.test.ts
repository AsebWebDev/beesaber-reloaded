import { describe, expect, it } from 'vitest';

import { de } from './de.ts';
import { en } from './en.ts';
import {
  browserLanguage,
  currentLocale,
  detectLanguage,
  i18n,
} from './i18n.ts';

describe('browserLanguage', () => {
  it('takes the first of the browser languages the app has', () => {
    expect(browserLanguage(['fr-FR', 'en-GB', 'de-DE'])).toBe('en');
    expect(browserLanguage(['fr-FR', 'de-DE', 'en-GB'])).toBe('de');
  });

  it('looks at the language only, not the region', () => {
    expect(browserLanguage(['de-AT'])).toBe('de');
    expect(browserLanguage(['de-CH'])).toBe('de');
    expect(browserLanguage(['EN'])).toBe('en');
  });

  it('finds nothing when the app has none of them', () => {
    expect(browserLanguage(['fr', 'ja'])).toBeUndefined();
    expect(browserLanguage([])).toBeUndefined();
  });
});

describe('currentLocale', () => {
  it("takes the browser's region when it is in the language the app shows", async () => {
    expect(currentLocale(['en-GB', 'de-DE'])).toBe('en-GB');

    await i18n.changeLanguage('de');

    expect(currentLocale(['en-GB', 'de-CH'])).toBe('de-CH');
  });

  it('falls back to the language alone', async () => {
    await i18n.changeLanguage('de');

    expect(currentLocale(['en-US'])).toBe('de');
  });
});

describe('detectLanguage', () => {
  it('prefers the language picked in this browser over the browser language', () => {
    localStorage.setItem('beesaber.language', 'de');

    expect(detectLanguage()).toBe('de');
  });

  it('ignores a stored value that is not a language the app has', () => {
    localStorage.setItem('beesaber.language', 'klingon');

    // The test browser says English
    expect(detectLanguage()).toBe('en');
  });
});

describe('the page language', () => {
  it('follows the language the app speaks', async () => {
    expect(document.documentElement.lang).toBe('en');

    await i18n.changeLanguage('de');

    expect(document.documentElement.lang).toBe('de');
  });
});

describe('the German texts', () => {
  it('have the singular and plural where German needs them', async () => {
    await i18n.changeLanguage('de');

    expect(i18n.t('dashboard.sharedMaps', { count: 1, number: '1' })).toBe(
      '1 gemeinsame Map'
    );
    expect(i18n.t('dashboard.sharedMaps', { count: 22, number: '22' })).toBe(
      '22 gemeinsame Maps'
    );
  });
});

describe('the translations', () => {
  type Texts = { [key: string]: string | Texts };

  /** Every text with its full key, like "layout.sync.button" */
  const flatten = (texts: Texts, prefix = ''): [string, string][] =>
    Object.entries(texts).flatMap(([key, value]) =>
      typeof value === 'string'
        ? [[`${prefix}${key}`, value] as [string, string]]
        : flatten(value, `${prefix}${key}.`)
    );

  it('translate every text, except words German uses as they are', () => {
    const english = new Map(flatten(en));
    const same = flatten(de)
      .filter(([key, text]) => english.get(key) === text)
      .map(([key]) => key);

    // A text copied over from English to get past the type check shows up
    // here. These few are the same word in both languages.
    expect(same).toEqual([
      'comparison.columns.map',
      'comparison.filter.label',
      'map.columns.score',
      'map.place',
      'map.title',
      'revenge.columns.map',
      'scores.columns.map',
      'scores.columns.score',
    ]);
  });

  it('keep every placeholder of the English text', () => {
    const placeholders = (text: string) =>
      [...text.matchAll(/{{(\w+)}}|<(\w+)\/?>/g)]
        .map(([, value, tag]) => value ?? tag)
        .sort();
    const english = new Map(flatten(en));
    const differing = flatten(de)
      .filter(
        ([key, text]) =>
          placeholders(text).join() !== placeholders(english.get(key)!).join()
      )
      .map(([key]) => key);

    expect(differing).toEqual([]);
  });
});

describe('counted texts', () => {
  it('say one thing in the singular and more in the plural', async () => {
    expect(i18n.t('common.mapsPlayed', { count: 1, number: '1' })).toBe(
      '1 map played'
    );
    expect(i18n.t('dashboard.sharedMaps', { count: 1, number: '1' })).toBe(
      '1 shared map'
    );
    expect(i18n.t('scores.listed', { count: 1234, number: '1,234' })).toBe(
      '1,234 scores in this list.'
    );

    await i18n.changeLanguage('de');

    expect(i18n.t('common.mapsPlayed', { count: 1, number: '1' })).toBe(
      '1 Map gespielt'
    );
    expect(i18n.t('common.mapsPlayed', { count: 2345, number: '2.345' })).toBe(
      '2.345 Maps gespielt'
    );
  });
});
