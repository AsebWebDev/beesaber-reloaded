import { describe, expect, it } from 'vitest';

import {
  api,
  app,
  APP_URL,
  createUser,
  linkProfile,
  ME,
  scoreSaber,
} from '../testing/harness.ts';

const BEE = '76561198000000002';

const addToHive = (playerId: string, as = api) =>
  as('/api/hive', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ playerId }),
  });

const json = async (response: Response) => (await response.json()) as never;

describe('GET /api/me', () => {
  it('answers 401 without a session', async () => {
    const response = await app.request('/api/me');

    expect(response.status).toBe(401);
  });

  it('returns the account, without a player until one is picked', async () => {
    const response = await api('/api/me');

    expect(await json(response)).toMatchObject({
      user: { id: 'test-user', playerId: null },
      player: null,
    });
  });

  it('returns the picked ScoreSaber profile along with the account', async () => {
    scoreSaber.setPlayer(ME, 'me', []);
    await linkProfile(ME);

    const response = await api('/api/me');

    expect(await json(response)).toMatchObject({
      user: { playerId: ME },
      player: { id: ME, name: 'me' },
    });
  });
});

describe('DELETE /api/me', () => {
  it('answers 401 without a session', async () => {
    const response = await app.request('/api/me', {
      method: 'DELETE',
      // Like a browser, say which site the request comes from
      headers: { origin: APP_URL },
    });

    expect(response.status).toBe(401);
  });

  it('deletes the account, which closes the routes it could open', async () => {
    scoreSaber.setPlayer(ME, 'me', []);
    await linkProfile(ME);

    const response = await api('/api/me', { method: 'DELETE' });

    expect(response.status).toBe(204);
    expect((await api('/api/me')).status).toBe(401);
  });

  it('takes the hive with it: a new account under the same id starts empty', async () => {
    scoreSaber.setPlayer(ME, 'me', []);
    scoreSaber.setPlayer(BEE, 'bee', []);
    await linkProfile(ME);
    await addToHive(BEE);

    await api('/api/me', { method: 'DELETE' });

    const again = await createUser('test-user');

    await linkProfile(ME, again);

    expect(await json(await again('/api/hive'))).toEqual({ items: [] });
  });

  it('leaves other accounts alone, and the players they follow', async () => {
    const other = await createUser('other-user');

    scoreSaber.setPlayer(ME, 'me', [
      { leaderboardId: 1, score: 500, playedAt: '2024-01-01T10:00:00.000Z' },
    ]);
    scoreSaber.setPlayer(BEE, 'bee', []);
    await linkProfile(ME);
    await linkProfile(BEE, other);
    // The other account follows the player I compare as
    await addToHive(ME, other);

    await api('/api/me', { method: 'DELETE' });

    expect(await json(await other('/api/hive'))).toMatchObject({
      items: [{ player: { id: ME, name: 'me' } }],
    });
    expect(await json(await other(`/api/players/${ME}/scores`))).toMatchObject({
      total: 1,
    });
  });
});

describe('PUT /api/me/player', () => {
  it('links the profile and fetches its scores', async () => {
    scoreSaber.setPlayer(ME, 'me', [
      { leaderboardId: 1, score: 500, playedAt: '2024-01-01T10:00:00.000Z' },
    ]);

    const response = await linkProfile(ME);

    expect(response.status).toBe(200);
    expect(await json(response)).toMatchObject({
      user: { playerId: ME },
      player: { id: ME },
    });

    const scores = await api(`/api/players/${ME}/scores`);

    expect(await json(scores)).toMatchObject({ total: 1 });
  });

  it('answers 404 for a player ScoreSaber does not know and links nothing', async () => {
    const response = await linkProfile('76561198999999999');

    expect(response.status).toBe(404);
    expect(await json(await api('/api/me'))).toMatchObject({
      user: { playerId: null },
    });
  });

  it('lets the user switch to another profile', async () => {
    const OTHER = '76561198000000009';

    scoreSaber.setPlayer(ME, 'me', []);
    scoreSaber.setPlayer(OTHER, 'other', []);
    await linkProfile(ME);

    await linkProfile(OTHER);

    expect(await json(await api('/api/me'))).toMatchObject({
      player: { id: OTHER, name: 'other' },
    });
  });

  it('rejects something that is not a ScoreSaber id', async () => {
    const response = await linkProfile('not-an-id');

    expect(response.status).toBe(400);
  });
});
