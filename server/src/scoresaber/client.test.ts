import { describe, expect, it } from 'vitest';

import {
  createFakeScoreSaber,
  FAKE_SCORESABER_URL,
} from '../testing/fakeScoreSaber.ts';
import { createScoreSaberClient } from './client.ts';

const PLAYER = '76561198000000001';

/** Wraps a fetch and notes the path of every request that goes through it */
const counting = (inner: typeof fetch) => {
  const paths: string[] = [];
  const counted: typeof fetch = (input, init) => {
    paths.push(new URL(new Request(input, init).url).pathname);

    return inner(input, init);
  };

  return { fetch: counted, paths };
};

describe('the two lanes of the ScoreSaber client', () => {
  it('sends score lists through the background lane and the rest through the other', async () => {
    const scoreSaber = createFakeScoreSaber();
    const interactive = counting(scoreSaber.fetch);
    const background = counting(scoreSaber.fetch);
    const client = createScoreSaberClient({
      baseUrl: FAKE_SCORESABER_URL,
      fetch: interactive.fetch,
      backgroundFetch: background.fetch,
    });

    scoreSaber.setPlayer(PLAYER, 'alice', [
      { leaderboardId: 1, score: 500, playedAt: '2024-01-01T10:00:00.000Z' },
    ]);

    await client.getPlayer(PLAYER);
    await client.searchPlayers('alice');
    for await (const page of client.getScorePages(PLAYER))
      expect(page.data).toHaveLength(1);

    expect(interactive.paths).toEqual([
      `/api/v2/players/${PLAYER}`,
      '/api/v2/players',
    ]);
    expect(background.paths).toEqual([`/api/v2/players/${PLAYER}/scores`]);
  });

  it('uses the one lane it was given when there is no second', async () => {
    const scoreSaber = createFakeScoreSaber();
    const only = counting(scoreSaber.fetch);
    const client = createScoreSaberClient({
      baseUrl: FAKE_SCORESABER_URL,
      fetch: only.fetch,
    });

    scoreSaber.setPlayer(PLAYER, 'alice', []);

    for await (const page of client.getScorePages(PLAYER))
      expect(page.data).toEqual([]);

    expect(only.paths).toEqual([`/api/v2/players/${PLAYER}/scores`]);
  });
});
