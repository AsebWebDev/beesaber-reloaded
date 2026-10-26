import { describe, expect, it } from 'vitest';

import { ApiError } from '@/api/client.ts';

import { errorText, LocalizedError } from './errors.ts';
import { i18n } from './i18n.ts';

const t = i18n.t;

describe('errorText', () => {
  it('has a text of its own for a code the server sends', () => {
    expect(
      errorText(
        new ApiError(404, 'not_in_hive', 'This player is not in your hive'),
        t
      )
    ).toBe('This player is not in your hive.');
  });

  it('fills in what the server gave along with the code', () => {
    expect(
      errorText(
        new ApiError(400, 'hive_full', 'A hive can have at most 50 bees', {
          maxSize: 50,
        }),
        t
      )
    ).toBe('A hive can have at most 50 bees.');
  });

  it('never shows the English message of a code it has no text for', () => {
    expect(errorText(new ApiError(418, 'teapot', 'I am a teapot'), t)).toBe(
      'Something went wrong'
    );
    // A proxy's HTML error page has no code at all
    expect(
      errorText(new ApiError(502, 'unknown', 'Something went wrong'), t)
    ).toBe('The server is having trouble. Please try again later.');
  });

  it('says it in German, too, for a code it has no text for', async () => {
    await i18n.changeLanguage('de');

    expect(errorText(new ApiError(418, 'teapot', 'I am a teapot'), t)).toBe(
      'Etwas ist schiefgelaufen'
    );
  });

  it('names a failure in the browser by its key, without what another service said', () => {
    const failed = new LocalizedError('googleFailed', 'Google did not answer');

    expect(errorText(failed, t)).toBe('Sign-in with Google failed.');
    // Still there for whoever reads the console
    expect(failed.message).toContain('Google did not answer');
  });

  it('says the server could not be reached when no answer came at all', () => {
    expect(errorText(new TypeError('Failed to fetch'), t)).toBe(
      'The server could not be reached. Check your connection and try again.'
    );
  });

  it('still says something for anything else', () => {
    expect(errorText(new Error('Boom'), t)).toBe('Something went wrong');
    expect(errorText('not even an error', t)).toBe('Something went wrong');
  });
});
