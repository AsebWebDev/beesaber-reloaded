import { createAuthClient } from 'better-auth/react';

import { LocalizedError } from '@/i18n/errors.ts';

/**
 * The browser side of Better Auth. It talks to /api/auth on our server,
 * which sets and clears the session cookie.
 *
 * Its calls do not throw when the server says no. They return
 * `{ data, error }`, and every function here turns an `error` into an
 * exception, so a failure cannot pass for a success.
 */
const authClient = createAuthClient();

/** Sends the browser to Google. It comes back signed in. */
const signInWithGoogle = async () => {
  const { error } = await authClient.signIn.social({
    provider: 'google',
    callbackURL: '/',
  });

  if (error) throw new LocalizedError('googleFailed', error.message);
};

/**
 * Signs in as a local test account, creating it on first use.
 *
 * Only exists in development builds. `import.meta.env.DEV` is a constant the
 * bundler knows, so in a production build this whole branch, including the
 * account's password, is removed from the code that is shipped. The server
 * refuses the account anyway unless it runs on localhost with DEV_LOGIN on.
 */
const signInAsDev = import.meta.env.DEV
  ? async () => {
      const account = {
        name: 'Dev',
        email: 'dev@beesaber.local',
        password: 'local-development-only',
      };
      const { email, password } = account;
      const signedIn = await authClient.signIn.email({ email, password });

      if (!signedIn.error) return;

      const signedUp = await authClient.signUp.email(account);

      if (signedUp.error)
        throw new LocalizedError('devSignInFailed', signedUp.error.message);
    }
  : undefined;

/**
 * Ends the session on the server. Throws if the server did not confirm it:
 * showing "signed out" while the session cookie still works would be a lie,
 * and a dangerous one on a shared computer.
 */
const signOut = async () => {
  const { error } = await authClient.signOut();

  if (error) throw new LocalizedError('signOutFailed');
};

export { signInAsDev, signInWithGoogle, signOut };
