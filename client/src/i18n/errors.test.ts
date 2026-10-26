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

  it('shows the server message for a code it has no text for', () => {
    expect(errorText(new ApiError(418, 'teapot', 'I am a teapot'), t)).toBe(
      'I am a teapot'
    );
  });

  it('names a failure in the browser by its key, with what another service said', () => {
    expect(errorText(new LocalizedError('signOutFailed'), t)).toBe(
      'Signing out failed. You are still signed in, please try again.'
    );
    expect(
      errorText(new LocalizedError('googleFailed', 'Google did not answer'), t)
    ).toBe('Sign-in with Google failed. Google did not answer');
  });

  it('says the server could not be reached when no answer came at all', () => {
    expect(errorText(new TypeError('Failed to fetch'), t)).toBe(
      'The server could not be reached. Check your connection and try again.'
    );
  });

  it('still says something for anything else', () => {
    expect(errorText(new Error('Boom'), t)).toBe('Boom');
    expect(errorText('not even an error', t)).toBe('Something went wrong');
  });
});
