import { ApiError } from '@/api/client.ts';

import { en } from './en.ts';

import type { TFunction } from 'i18next';

/**
 * Turning a failure into a text for the visitor, in their language.
 *
 * The server says what went wrong with a code, and its message is English
 * for people reading logs. The app has a text of its own for every code it
 * knows. Failures that happen in the browser carry a key instead of a text,
 * so they too follow the language, even when it changes later.
 */

type ApiErrorCode = keyof typeof en.errors.api;
type LocalErrorKey = keyof typeof en.errors.local;

/** True for every code the server sends that has a text of its own */
const isKnownCode = (code: string): code is ApiErrorCode =>
  Object.hasOwn(en.errors.api, code);

/**
 * A failure in the browser, named by the key of its text. `detail` is what
 * another service said about it. It is kept in the message, for whoever looks
 * at the console, but not shown: it is English whatever the language, and
 * rarely means anything to a visitor.
 */
class LocalizedError extends Error {
  readonly detail: string | undefined;
  readonly key: LocalErrorKey;

  constructor(key: LocalErrorKey, detail?: string) {
    super(detail === undefined ? key : `${key}: ${detail}`);
    this.name = 'LocalizedError';
    this.key = key;
    this.detail = detail;
  }
}

/**
 * The text that tells the visitor what went wrong. Always one of the app's
 * own texts, in the visitor's language: never the English of a server
 * message, a library or the browser.
 */
const errorText = (error: unknown, t: TFunction): string => {
  if (error instanceof LocalizedError) return t(`errors.local.${error.key}`);

  if (error instanceof ApiError) {
    if (isKnownCode(error.code))
      return t(`errors.api.${error.code}`, { ...error.details });

    // A code this version does not know yet, or an answer that was not our
    // API's at all, like the HTML error page of a proxy in front of it
    return error.status >= 500
      ? t('errors.api.internal_error')
      : t('common.somethingWentWrong');
  }

  // What fetch throws when no answer comes at all: no network, or the
  // server is down. The browser's own words for it ("Failed to fetch")
  // help nobody.
  if (error instanceof TypeError) return t('errors.network');

  return t('common.somethingWentWrong');
};

export { errorText, LocalizedError };
export type { ApiErrorCode, LocalErrorKey };
