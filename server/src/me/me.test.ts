import { describe, expect, it } from 'vitest';

import { api, app, linkProfile, ME, scoreSaber } from '../testing/harness.ts';

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
