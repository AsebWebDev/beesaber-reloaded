import { describe, expect, it, vi } from 'vitest';

import { createTokenPassword, managedIdentityTokens } from './password.ts';

const MINUTE = 60_000;

/** Hands out numbered tokens that expire an hour after "now" */
const fakeSource = (now: () => number) => {
  let issued = 0;

  return vi.fn(() =>
    Promise.resolve({
      token: `token-${++issued}`,
      expiresAt: now() + 60 * MINUTE,
    })
  );
};

describe('the database password from tokens', () => {
  it('keeps the token for further connections', async () => {
    const source = fakeSource(Date.now);
    const password = createTokenPassword(source);

    expect(await password()).toBe('token-1');
    expect(await password()).toBe('token-1');
    expect(source).toHaveBeenCalledTimes(1);
  });

  it('asks once when many connections open at the same time', async () => {
    const source = fakeSource(Date.now);
    const password = createTokenPassword(source);

    const passwords = await Promise.all([password(), password(), password()]);

    expect(passwords).toEqual(['token-1', 'token-1', 'token-1']);
    expect(source).toHaveBeenCalledTimes(1);
  });

  it('gets a new token shortly before the old one expires', async () => {
    let time = 0;
    const now = () => time;
    const password = createTokenPassword(fakeSource(now), now);

    await password();
    time += 54 * MINUTE;
    expect(await password()).toBe('token-1');

    time += 2 * MINUTE;
    expect(await password()).toBe('token-2');
  });

  it('asks once when many connections need a new token at the same time', async () => {
    let time = 0;
    const now = () => time;
    const source = fakeSource(now);
    const password = createTokenPassword(source, now);

    await password();
    time += 56 * MINUTE;

    const passwords = await Promise.all([password(), password(), password()]);

    expect(passwords).toEqual(['token-2', 'token-2', 'token-2']);
    expect(source).toHaveBeenCalledTimes(2);
  });

  it('keeps using the old token while it is valid when a new one cannot be had', async () => {
    let time = 0;
    const now = () => time;
    const source = fakeSource(now);
    const password = createTokenPassword(source, now);

    await password();
    time += 56 * MINUTE;
    source.mockRejectedValueOnce(new Error('Azure is unreachable'));

    expect(await password()).toBe('token-1');

    time += 5 * MINUTE;
    source.mockRejectedValueOnce(new Error('Azure is unreachable'));

    await expect(password()).rejects.toThrow('Azure is unreachable');
  });

  it('asks again after a failed request', async () => {
    const source = fakeSource(Date.now);
    const password = createTokenPassword(source);

    source.mockRejectedValueOnce(new Error('Azure is unreachable'));

    await expect(password()).rejects.toThrow('Azure is unreachable');
    expect(await password()).toBe('token-1');
    expect(source).toHaveBeenCalledTimes(2);
  });
});

describe('tokens of a managed identity', () => {
  const env = {
    IDENTITY_ENDPOINT: 'http://localhost:42356/msi/token',
    IDENTITY_HEADER: 'header-from-azure',
  };

  it('asks the local endpoint for a token of that identity for Postgres', async () => {
    const fetchToken = vi.fn<
      (url: URL, init: RequestInit) => Promise<Response>
    >(() =>
      Promise.resolve(
        Response.json({ access_token: 'eyJ0', expires_on: '1586984735' })
      )
    );

    const token = await managedIdentityTokens('client-id', env, fetchToken)();

    expect(token).toEqual({ token: 'eyJ0', expiresAt: 1_586_984_735_000 });

    const [url, init] = fetchToken.mock.calls[0]!;
    const { origin, pathname, searchParams } = url;

    expect(origin + pathname).toBe('http://localhost:42356/msi/token');
    expect(searchParams.get('resource')).toBe(
      'https://ossrdbms-aad.database.windows.net'
    );
    expect(searchParams.get('api-version')).toBe('2019-08-01');
    expect(searchParams.get('client_id')).toBe('client-id');
    expect(init.headers).toEqual({ 'X-IDENTITY-HEADER': 'header-from-azure' });
  });

  it('fails when Azure refuses', async () => {
    const fetchToken = () =>
      Promise.resolve(new Response('no such identity', { status: 400 }));

    await expect(
      managedIdentityTokens('client-id', env, fetchToken)()
    ).rejects.toThrow('No database token from Azure: 400');
  });

  it('fails outside of Azure, where there is no endpoint', async () => {
    await expect(managedIdentityTokens('client-id', {})()).rejects.toThrow(
      /IDENTITY_ENDPOINT/
    );
  });
});
