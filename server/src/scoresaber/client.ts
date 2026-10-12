import createClient from 'openapi-fetch';
import { z } from 'zod';

import type { paths } from './openapi.d.ts';

/**
 * The part of the ScoreSaber API this server uses.
 *
 * Two layers of safety, for two different mistakes:
 * - `openapi.d.ts` is generated from ScoreSaber's OpenAPI description. It
 *   makes the compiler check our paths and parameters.
 * - The zod schemas below check the answers at runtime. Types are gone once
 *   the code runs; if ScoreSaber changes a field, parsing fails right here
 *   with a clear message instead of writing broken data to the database.
 *
 * The schemas name only the fields we use. Everything else is dropped.
 */

const playerSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  avatar: z.string(),
  inactive: z.boolean(),
  stats: z.object({
    rank: z.number(),
    countryRank: z.number(),
    totalPP: z.number(),
    totalPlayedLeaderboards: z.number(),
  }),
});

const playerScoreSchema = z.object({
  score: z.object({
    id: z.number(),
    rank: z.number(),
    unmodifiedScore: z.number(),
    modifiedScore: z.number(),
    accuracy: z.number(),
    pp: z.number(),
    mods: z.array(z.string()),
    badCuts: z.number(),
    missedNotes: z.number(),
    maxCombo: z.number(),
    fullCombo: z.boolean(),
    createdAt: z.iso.datetime(),
  }),
  leaderboard: z.object({
    id: z.number(),
    maxScore: z.number(),
    map: z.object({
      hash: z.string(),
      songName: z.string(),
      songSubName: z.string(),
      songAuthorName: z.string(),
      levelAuthorName: z.string(),
      coverUrl: z.string(),
    }),
    difficulty: z.object({
      difficulty: z.number(),
      gameMode: z.string(),
    }),
    realm: z.object({
      leaderboardStatus: z.string(),
      stars: z.number(),
    }),
  }),
});

const metadataSchema = z.object({
  page: z.number(),
  itemsPerPage: z.number(),
  totalItems: z.number(),
  totalPages: z.number(),
});

const playerListSchema = z.object({
  data: z.array(playerSchema),
  metadata: metadataSchema,
});

const scorePageSchema = z.object({
  data: z.array(playerScoreSchema),
  metadata: metadataSchema,
});

type ScoreSaberPlayer = z.infer<typeof playerSchema>;
type ScoreSaberPlayerScore = z.infer<typeof playerScoreSchema>;
type ScoreSaberScorePage = z.infer<typeof scorePageSchema>;

type ErrorKind = 'not_found' | 'unavailable' | 'unexpected_response';

/** Any failure of a call to ScoreSaber, with a kind the caller can act on */
class ScoreSaberError extends Error {
  readonly kind: ErrorKind;

  constructor(kind: ErrorKind, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ScoreSaberError';
    this.kind = kind;
  }
}

/** The most scores ScoreSaber returns in one page */
const SCORES_PER_PAGE = 100;

type Options = {
  baseUrl: string;
  fetch?: typeof fetch;
};

const createScoreSaberClient = ({ baseUrl, fetch: customFetch }: Options) => {
  const api = createClient<paths>({ baseUrl, fetch: customFetch });

  /** Turns the three ways a call can go wrong into a ScoreSaberError */
  const unwrap = async <Output>(
    what: string,
    schema: z.ZodType<Output>,
    call: Promise<{ data?: unknown; response: Response }>
  ): Promise<Output> => {
    let result: Awaited<typeof call>;

    try {
      result = await call;
    } catch (cause) {
      throw new ScoreSaberError('unavailable', `${what}: request failed`, {
        cause,
      });
    }

    const { status } = result.response;

    if (status === 404)
      throw new ScoreSaberError('not_found', `${what}: not found`);
    if (!result.response.ok)
      throw new ScoreSaberError('unavailable', `${what}: HTTP ${status}`);

    const parsed = schema.safeParse(result.data);

    if (!parsed.success)
      throw new ScoreSaberError(
        'unexpected_response',
        `${what}: the answer does not look as expected\n${z.prettifyError(parsed.error)}`
      );

    return parsed.data;
  };

  const getPlayer = (id: string): Promise<ScoreSaberPlayer> =>
    unwrap(
      `Player ${id}`,
      playerSchema,
      api.GET('/api/v2/players/{id}', { params: { path: { id } } })
    );

  /** Finds players by name. ScoreSaber needs at least 3 characters. */
  const searchPlayers = async (name: string): Promise<ScoreSaberPlayer[]> => {
    const { data } = await unwrap(
      `Player search "${name}"`,
      playerListSchema,
      api.GET('/api/v2/players', {
        params: { query: { search: name, limit: 20, includeInactive: 'true' } },
      })
    );

    return data;
  };

  /**
   * One page of a player's scores, oldest first. With `from`, only scores set
   * at or after that moment.
   *
   * Oldest first, because a sync that gets interrupted has then stored a
   * gap-free beginning and can continue from its newest score.
   */
  const getScorePage = (
    playerId: string,
    { page, from }: { from?: Date; page: number }
  ): Promise<ScoreSaberScorePage> =>
    unwrap(
      `Scores of player ${playerId}, page ${page}`,
      scorePageSchema,
      api.GET('/api/v2/players/{id}/scores', {
        params: {
          path: { id: playerId },
          query: {
            sort: 'oldest',
            limit: SCORES_PER_PAGE,
            page,
            from: from?.toISOString(),
          },
        },
      })
    );

  /**
   * All of a player's scores, a page at a time, oldest first.
   *
   * The next page is asked for by time ("everything from the last score I
   * have seen"), not by page number. A list that is sorted by time changes
   * while we read it: when the player improves an old score, that entry
   * jumps to the end and everything behind it moves up by one. Counting
   * pages would then skip the score that slid across a page boundary, for
   * good. Asking by time cannot skip anything; the last score of a page
   * simply shows up again as the first of the next.
   */
  async function* getScorePages(
    playerId: string,
    { from }: { from?: Date } = {}
  ): AsyncGenerator<ScoreSaberScorePage> {
    let cursor = from;
    let page = 1;

    for (;;) {
      const scorePage = await getScorePage(playerId, { page, from: cursor });

      yield scorePage;

      // A page that is not full is the last one. The totals in `metadata`
      // are not used: ScoreSaber has been seen to count scores there that it
      // never returns.
      const last = scorePage.data.at(-1);

      if (last === undefined || scorePage.data.length < SCORES_PER_PAGE) return;

      const lastPlayedAt = new Date(last.score.createdAt);

      if (cursor !== undefined && lastPlayedAt.getTime() === cursor.getTime()) {
        // A whole page of scores with the same timestamp: time alone does
        // not get us further, so count pages within that moment
        page += 1;
      } else {
        cursor = lastPlayedAt;
        page = 1;
      }
    }
  }

  return { getPlayer, getScorePages, searchPlayers };
};

type ScoreSaberClient = ReturnType<typeof createScoreSaberClient>;

export { createScoreSaberClient, SCORES_PER_PAGE, ScoreSaberError };
export type {
  ScoreSaberClient,
  ScoreSaberPlayer,
  ScoreSaberPlayerScore,
  ScoreSaberScorePage,
};
