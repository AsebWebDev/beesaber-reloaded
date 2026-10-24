import { z } from 'zod';

/** What the tokens are for: Azure's Postgres servers */
const DATABASE_RESOURCE = 'https://ossrdbms-aad.database.windows.net';

/**
 * A token this close to its end is replaced, so that no connection signs in
 * with one that runs out on the way. Postgres checks the token only when a
 * connection opens; an open connection keeps working after it expires.
 */
const REFRESH_MARGIN_MS = 5 * 60_000;

/** Asked for the password whenever a new connection opens */
type DatabasePassword = () => Promise<string>;

type Token = { token: string; expiresAt: number };

/** Somewhere to get a new token from, like Entra ID */
type TokenSource = () => Promise<Token>;

const tokenResponse = z.object({
  access_token: z.string(),
  // Seconds since 1970, as a string
  expires_on: z.coerce.number(),
});

/** The part of fetch that asking for a token needs */
type FetchToken = (url: URL, init: RequestInit) => Promise<Response>;

/**
 * Asks Azure for a token of the managed identity with this client id.
 *
 * Inside a container app, Azure answers on a local address, which it puts
 * into IDENTITY_ENDPOINT. The header proves that the request comes from code
 * in the container: a request that someone tricks the server into sending
 * to that address does not carry it.
 *
 * Microsoft's @azure/identity would do the same. It brings MSAL
 * (@azure/msal-node) and some 40 packages along, made for every way of
 * signing in to Azure, from browser logins to certificates. This server
 * needs one of them, which is a single documented request. Every package
 * is code that runs with the server's rights and whose security advisories
 * someone has to follow, so the request is made here instead.
 */
const managedIdentityTokens =
  (
    clientId: string,
    env: NodeJS.ProcessEnv = process.env,
    fetchToken: FetchToken = fetch
  ): TokenSource =>
  async () => {
    const endpoint = env.IDENTITY_ENDPOINT;
    const header = env.IDENTITY_HEADER;

    if (endpoint === undefined || header === undefined)
      throw new Error(
        'No managed identity here: IDENTITY_ENDPOINT and IDENTITY_HEADER are not set'
      );

    const url = new URL(endpoint);

    url.searchParams.set('resource', DATABASE_RESOURCE);
    url.searchParams.set('api-version', '2019-08-01');
    url.searchParams.set('client_id', clientId);

    const response = await fetchToken(url, {
      headers: { 'X-IDENTITY-HEADER': header },
    });

    if (!response.ok)
      throw new Error(`No database token from Azure: ${response.status}`);

    const body = tokenResponse.parse(await response.json());

    return { token: body.access_token, expiresAt: body.expires_on * 1000 };
  };

/**
 * Signs in with tokens instead of a password. A token is kept until shortly
 * before it expires, and a pool that opens many connections at once asks
 * for one token, not one each.
 */
const createTokenPassword = (
  source: TokenSource,
  now: () => number = Date.now
): DatabasePassword => {
  let current: Token | undefined;
  let pending: Promise<Token> | undefined;

  // Connections that need a new token at the same time wait for one request
  const refresh = () =>
    (pending ??= source()
      .then((token) => (current = token))
      .finally(() => {
        pending = undefined;
      }));

  return async () => {
    if (current !== undefined && current.expiresAt - now() >= REFRESH_MARGIN_MS)
      return current.token;

    try {
      return (await refresh()).token;
    } catch (error) {
      // The old token still works for a few minutes, and the next
      // connection asks again
      if (current !== undefined && current.expiresAt > now())
        return current.token;

      throw error;
    }
  };
};

/**
 * With the client id of a managed identity, the server signs in to the
 * database as that identity, and DATABASE_URL holds no password. Without
 * it, the password in DATABASE_URL is used, as on a developer's machine.
 */
const databasePassword = (identityClientId: string | undefined) =>
  identityClientId === undefined
    ? undefined
    : createTokenPassword(managedIdentityTokens(identityClientId));

export { createTokenPassword, databasePassword, managedIdentityTokens };
export type { DatabasePassword };
