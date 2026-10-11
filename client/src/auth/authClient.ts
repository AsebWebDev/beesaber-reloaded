import { createAuthClient } from 'better-auth/react';

/**
 * The browser side of Better Auth. It talks to /api/auth on our server,
 * which sets and clears the session cookie.
 */
const authClient = createAuthClient();

// The local test account. The server only accepts it with DEV_LOGIN=true.
const DEV_ACCOUNT = {
  name: 'Dev',
  email: 'dev@beesaber.local',
  password: 'local-development-only',
};

/** Sends the browser to Google. It comes back signed in. */
const signInWithGoogle = async () => {
  const { error } = await authClient.signIn.social({
    provider: 'google',
    callbackURL: '/',
  });

  if (error) throw new Error(error.message ?? 'Sign-in with Google failed');
};

/** Signs in as the local test account, creating it on first use */
const signInAsDev = async () => {
  const { email, password } = DEV_ACCOUNT;
  const signedIn = await authClient.signIn.email({ email, password });

  if (!signedIn.error) return;

  const signedUp = await authClient.signUp.email(DEV_ACCOUNT);

  if (signedUp.error)
    throw new Error(signedUp.error.message ?? 'Dev sign-in failed');
};

const signOut = async () => {
  await authClient.signOut();
};

export { signInAsDev, signInWithGoogle, signOut };
