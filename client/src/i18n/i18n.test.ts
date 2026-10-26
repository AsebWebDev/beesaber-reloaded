import { describe, expect, it } from 'vitest';

import { browserLanguage, i18n } from './i18n.ts';

describe('browserLanguage', () => {
  it('takes the first of the browser languages the app has', () => {
    expect(browserLanguage(['fr-FR', 'en-GB', 'de-DE'])).toBe('en');
  });

  it('looks at the language only, not the region', () => {
    expect(browserLanguage(['en-AU'])).toBe('en');
    expect(browserLanguage(['EN'])).toBe('en');
  });

  it('finds nothing when the app has none of them', () => {
    expect(browserLanguage(['fr', 'ja'])).toBeUndefined();
    expect(browserLanguage([])).toBeUndefined();
  });
});

describe('the page language', () => {
  it('follows the language the app speaks', () => {
    expect(document.documentElement.lang).toBe(i18n.language);
  });
});
