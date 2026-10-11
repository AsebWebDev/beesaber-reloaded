import { describe, expect, it } from 'vitest';

import { createApp } from '../app.ts';
import { createScoreSaberClient } from '../scoresaber/client.ts';
import { FAKE_SCORESABER_URL } from '../testing/fakeScoreSaber.ts';
import { database, scoreSaber } from '../testing/harness.ts';
import { createAuth } from './auth.ts';

/**
 * The other tests replace sign-in with a shortcut. These use the real thing,
 * Better Auth with the test database, to prove that the pieces fit: an
 * account is created, a session cookie comes back, and the cookie opens the
 * protected routes.
 */

const APP_URL = 'http://localhost:3000';

const createRealApp = (devLogin: boolean) =>
  createApp({
    appUrl: APP_URL,
    auth: createAuth(database.db, {
      APP_URL,
      AUTH_SECRET: 'a-secret-only-used-by-the-automated-tests',
      DEV_LOGIN: devLogin,
      GOOGLE_CLIENT_ID: undefined,
      GOOGLE_CLIENT_SECRET: undefined,
    }),
    db: database.db,
    scoreSaber: createScoreSaberClient({
      baseUrl: FAKE_SCORESABER_URL,
      fetch: scoreSaber.fetch,
    }),
  });

const signUp = (app: ReturnType<typeof createRealApp>) =>
  app.request('/api/auth/sign-up/email', {
    method: 'POST',
    // Better Auth rejects requests from other sites, so it wants an origin
    headers: { 'content-type': 'application/json', origin: APP_URL },
    body: JSON.stringify({
      name: 'Dev',
      email: 'dev@example.test',
      password: 'correct horse battery staple',
    }),
  });

/** The cookies a response sets, in the form a request sends them back */
const cookiesOf = (response: Response) =>
  response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(';')[0])
    .join('; ');

describe('sign-in with Better Auth', () => {
  it('creates an account and a session that opens protected routes', async () => {
    const app = createRealApp(true);

    const signedUp = await signUp(app);

    expect(signedUp.status).toBe(200);

    const me = await app.request('/api/me', {
      headers: { cookie: cookiesOf(signedUp) },
    });

    expect(me.status).toBe(200);
    expect(await me.json()).toMatchObject({
      user: { name: 'Dev', email: 'dev@example.test', playerId: null },
      player: null,
    });
  });

  it('marks the session cookie as unreadable for scripts', async () => {
    const signedUp = await signUp(createRealApp(true));
    const sessionCookie = signedUp.headers
      .getSetCookie()
      .find((cookie) => cookie.includes('session_token'));

    expect(sessionCookie).toMatch(/HttpOnly/i);
    expect(sessionCookie).toMatch(/SameSite=Lax/i);
  });

  it('closes the protected routes again after signing out', async () => {
    const app = createRealApp(true);
    const cookie = cookiesOf(await signUp(app));

    const signedOut = await app.request('/api/auth/sign-out', {
      method: 'POST',
      headers: { cookie, origin: APP_URL },
    });

    expect(signedOut.status).toBe(200);

    const me = await app.request('/api/me', { headers: { cookie } });

    expect(me.status).toBe(401);
  });

  it('does not let a made-up cookie in', async () => {
    const me = await createRealApp(true).request('/api/me', {
      headers: { cookie: 'better-auth.session_token=made-up' },
    });

    expect(me.status).toBe(401);
  });

  it('refuses accounts with a password when the test sign-in is off', async () => {
    const response = await signUp(createRealApp(false));

    expect(response.ok).toBe(false);
  });

  it('does not accept a player id through the sign-up request', async () => {
    const app = createRealApp(true);

    const signedUp = await app.request('/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: APP_URL },
      body: JSON.stringify({
        name: 'Dev',
        email: 'dev@example.test',
        password: 'correct horse battery staple',
        playerId: '76561198000000001',
      }),
    });
    const me = await app.request('/api/me', {
      headers: { cookie: cookiesOf(signedUp) },
    });

    // Either the request is refused, or the field is ignored
    if (me.status === 200)
      expect(await me.json()).toMatchObject({ user: { playerId: null } });
    else expect(signedUp.ok).toBe(false);
  });
});
