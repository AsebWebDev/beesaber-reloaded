import { describe, expect, it } from 'vitest';

import { browserLanguage, i18n } from './i18n.ts';

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

    expect(i18n.t('dashboard.sharedMaps', { count: 1 })).toBe(
      '1 gemeinsame Map'
    );
    expect(i18n.t('dashboard.sharedMaps', { count: 22 })).toBe(
      '22 gemeinsame Maps'
    );
  });
});
