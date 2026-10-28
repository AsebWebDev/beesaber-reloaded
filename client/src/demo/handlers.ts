import { http, HttpResponse } from 'msw';

import { BEES, leaderboardOf, ME, PLAYERS, SCORES } from './data.ts';

import type {
  AddedBee,
  ComparisonEntry,
  ComparisonPage,
  Config,
  FoundPlayer,
  HiveMember,
  MapRanking,
  Me,
  NewsItem,
  Player,
  RevengeItem,
  RevengePage,
  ScoreEntry,
  ScorePage,
  SyncRequest,
  SyncStatus,
  TrendingItem,
  TrendingPage,
} from '@/api/queries.ts';

/**
 * The API of the demo: answers the app's requests in the browser, from the
 * made-up hive in data.ts, the way the real server would. Every answer is
 * typed with the type of the real route, so when the server's answers
 * change, the type check points here.
 *
 * Each visit gets its own hive. Adding a bee or picking another profile
 * changes it for this visitor until the page is loaded again; nothing
 * leaves the browser.
 */

type Score = ScoreEntry['score'];

/** How many days back "what the hive is playing" looks, like the server */
const TRENDING_DAYS = 14;

const DAY = 24 * 60 * 60 * 1000;

type Options = {
  /** Put in front of every path, so that the demo never calls the real API */
  base?: string;
  /**
   * Where "Sign in with Google" leads. The demo starts over there; without
   * it, the sign-in only signs in again.
   */
  signInUrl?: string;
};

type State = { hive: string[]; playerId: string; signedIn: boolean };

const initial = (): State => ({
  hive: BEES.map(({ id }) => id),
  playerId: ME.id,
  signedIn: true,
});

const playerOf = (id: string) => PLAYERS.find((known) => known.id === id);

const short = ({ avatarUrl, id, name }: Player) => ({ id, name, avatarUrl });

const scoreOn = (playerId: string, leaderboardId: number) =>
  SCORES[playerId]?.find((played) => played.leaderboardId === leaderboardId);

const error = (status: number, code: string, message: string) =>
  HttpResponse.json({ error: { code, message } }, { status });

const paginated = <Item>(items: Item[], url: URL) => {
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get('limit') ?? 20) || 20)
  );

  return {
    items: items.slice((page - 1) * limit, page * limit),
    page,
    limit,
    total: items.length,
    totalPages: Math.ceil(items.length / limit),
  };
};

const createDemoHandlers = ({ base = '', signInUrl }: Options = {}) => {
  let state = initial();

  const me = () => playerOf(state.playerId) ?? ME;

  /** The maps both have played, as the comparison lists them */
  const shared = (beeId: string): ComparisonEntry[] =>
    (SCORES[me().id] ?? [])
      .flatMap((mine) => {
        const theirs = scoreOn(beeId, mine.leaderboardId);
        const board = leaderboardOf(mine.leaderboardId);

        return theirs === undefined || board === undefined
          ? []
          : [{ leaderboard: board, mine, theirs }];
      })
      // The server's order: the latest play of either first
      .sort(
        (a, b) =>
          Math.max(Date.parse(b.mine.playedAt), Date.parse(b.theirs.playedAt)) -
          Math.max(Date.parse(a.mine.playedAt), Date.parse(a.theirs.playedAt))
      );

  const member = (id: string): HiveMember => {
    const both = shared(id);

    return {
      player: playerOf(id)!,
      addedAt: new Date(Date.now() - 30 * DAY).toISOString(),
      shared: both.length,
      winning: both.filter((e) => e.mine.modifiedScore > e.theirs.modifiedScore)
        .length,
      losing: both.filter((e) => e.mine.modifiedScore < e.theirs.modifiedScore)
        .length,
    };
  };

  const meAnswer = (): Me => ({
    user: {
      id: 'demo-user',
      email: 'demo@beesaber.de',
      name: 'Demo',
      image: null,
      playerId: me().id,
    },
    player: me(),
  });

  const session = () => ({
    user: { id: 'demo-user', email: 'demo@beesaber.de', name: 'Demo' },
    session: { id: 'demo-session', token: 'demo' },
  });

  /** No answer without a session, like the server */
  const signedOut = () =>
    state.signedIn ? undefined : error(401, 'unauthorized', 'Not signed in');

  const revenge = (beeFilter: string | null): RevengeItem[] =>
    state.hive
      .filter((id) => beeFilter === null || id === beeFilter)
      .flatMap((beeId) =>
        shared(beeId)
          .filter(
            ({ mine, theirs }) => theirs.modifiedScore > mine.modifiedScore
          )
          .map(({ leaderboard: board, mine, theirs }) => ({
            leaderboard: board,
            bee: short(playerOf(beeId)!),
            myScore: mine.modifiedScore,
            theirScore: theirs.modifiedScore,
            gap: theirs.modifiedScore - mine.modifiedScore,
            gapShare:
              board.maxScore > 0
                ? (theirs.modifiedScore - mine.modifiedScore) / board.maxScore
                : null,
          }))
      )
      // The closest first, in accuracy points, like the server
      .sort((a, b) => (a.gapShare ?? 1) - (b.gapShare ?? 1) || a.gap - b.gap);

  const trending = (): TrendingItem[] => {
    const since = Date.now() - TRENDING_DAYS * DAY;
    const mine = new Set(
      (SCORES[me().id] ?? []).map((played) => played.leaderboardId)
    );
    const byMap = new Map<number, { bees: Player[]; last: number }>();

    for (const beeId of state.hive)
      for (const played of SCORES[beeId] ?? []) {
        const at = Date.parse(played.playedAt);

        if (at < since || mine.has(played.leaderboardId)) continue;

        const entry = byMap.get(played.leaderboardId) ?? { bees: [], last: 0 };

        entry.bees.push(playerOf(beeId)!);
        entry.last = Math.max(entry.last, at);
        byMap.set(played.leaderboardId, entry);
      }

    return (
      [...byMap.entries()]
        .map(([id, { bees, last }]) => ({
          leaderboard: leaderboardOf(id)!,
          bees: bees.map(short),
          lastPlayedAt: new Date(last).toISOString(),
        }))
        // Played by the most bees first, then the latest, like the server
        .sort(
          (a, b) =>
            b.bees.length - a.bees.length ||
            Date.parse(b.lastPlayedAt) - Date.parse(a.lastPlayedAt)
        )
    );
  };

  /** A bee overtook me lately: their new score, and what they had before */
  const news = (): NewsItem[] =>
    state.hive
      .flatMap((beeId) =>
        shared(beeId)
          .filter(
            ({ mine, theirs }) =>
              theirs.modifiedScore > mine.modifiedScore &&
              Date.parse(theirs.playedAt) > Date.now() - TRENDING_DAYS * DAY
          )
          .map(({ leaderboard: board, mine, theirs }) => ({
            event: {
              // One per bee and map: the app keys the news by it
              id: board.id * 10 + Number(beeId.slice(-1)),
              playerId: beeId,
              leaderboardId: board.id,
              // Just below my score before, so this play went past me
              previousScore: Math.round(mine.modifiedScore * 0.985),
              newScore: theirs.modifiedScore,
              playedAt: theirs.playedAt,
            },
            player: short(playerOf(beeId)!),
            leaderboard: board,
            myScore: mine.modifiedScore,
            theirScore: theirs.modifiedScore,
          }))
      )
      .sort(
        (a, b) => Date.parse(b.event.playedAt) - Date.parse(a.event.playedAt)
      );

  const handlers = [
    http.get(`${base}/api/config`, () =>
      HttpResponse.json({
        signIn: { devLogin: false, google: true },
      } satisfies Config)
    ),

    // What Better Auth's browser client calls
    http.get(`${base}/api/auth/get-session`, () =>
      HttpResponse.json(state.signedIn ? session() : null)
    ),
    http.post(`${base}/api/auth/sign-in/social`, () => {
      state.signedIn = true;

      return HttpResponse.json(
        signInUrl === undefined
          ? { url: '/', redirect: false }
          : { url: signInUrl, redirect: true }
      );
    }),
    http.post(`${base}/api/auth/sign-out`, () => {
      state.signedIn = false;

      return HttpResponse.json({ success: true });
    }),

    http.get(
      `${base}/api/me`,
      () => signedOut() ?? HttpResponse.json(meAnswer())
    ),
    // Nothing to delete: the demo's account starts over
    http.delete(`${base}/api/me`, () => {
      state = { ...initial(), signedIn: false };

      return new HttpResponse(null, { status: 204 });
    }),
    http.put(`${base}/api/me/player`, async ({ request }) => {
      const { playerId } = (await request.json()) as { playerId: string };

      if (playerOf(playerId) === undefined)
        return error(404, 'unknown_player', 'No such player on ScoreSaber');

      state.playerId = playerId;
      state.hive = state.hive.filter((id) => id !== playerId);

      return HttpResponse.json(meAnswer());
    }),

    http.get(`${base}/api/players/search`, ({ request }) => {
      const query = (
        new URL(request.url).searchParams.get('q') ?? ''
      ).toLowerCase();
      const items: FoundPlayer[] = PLAYERS.filter(({ name }) =>
        name.toLowerCase().includes(query)
      ).map(({ avatarUrl, country, id, name, rank }) => ({
        id,
        name,
        country,
        avatarUrl,
        rank,
      }));

      return HttpResponse.json({ items });
    }),
    http.get(`${base}/api/players/:id/scores`, ({ params, request }) => {
      const refused = signedOut();

      if (refused !== undefined) return refused;

      const url = new URL(request.url);
      const search = url.searchParams.get('search')?.toLowerCase();
      const scores = (SCORES[String(params.id)] ?? []).flatMap((played) => {
        const board = leaderboardOf(played.leaderboardId);

        return board === undefined
          ? []
          : [{ leaderboard: board, score: played }];
      });
      const sorted =
        url.searchParams.get('sort') === 'top'
          ? scores.sort((a, b) => b.score.pp - a.score.pp)
          : scores.sort(
              (a, b) =>
                Date.parse(b.score.playedAt) - Date.parse(a.score.playedAt)
            );

      return HttpResponse.json(
        paginated(
          sorted.filter(
            ({ leaderboard: board }) =>
              search === undefined ||
              board.songName.toLowerCase().includes(search)
          ),
          url
        ) satisfies ScorePage
      );
    }),

    http.get(
      `${base}/api/hive`,
      () =>
        signedOut() ??
        HttpResponse.json({ items: state.hive.map((id) => member(id)) })
    ),
    http.post(`${base}/api/hive`, async ({ request }) => {
      const refused = signedOut();

      if (refused !== undefined) return refused;

      const { playerId } = (await request.json()) as { playerId: string };
      const found = playerOf(playerId);

      if (found === undefined)
        return error(404, 'unknown_player', 'No such player on ScoreSaber');
      if (playerId === state.playerId)
        return error(
          400,
          'cannot_add_self',
          'You cannot add yourself to your hive'
        );
      if (!state.hive.includes(playerId)) state.hive.push(playerId);

      return HttpResponse.json({ player: found } satisfies AddedBee, {
        status: 201,
      });
    }),
    http.delete(`${base}/api/hive/:playerId`, ({ params }) => {
      const id = String(params.playerId);

      if (!state.hive.includes(id))
        return error(404, 'not_in_hive', 'This player is not in your hive');

      state.hive = state.hive.filter((bee) => bee !== id);

      return new HttpResponse(null, { status: 204 });
    }),
    http.get(
      `${base}/api/hive/news`,
      ({ request }) =>
        signedOut() ??
        HttpResponse.json({
          items: news().slice(
            0,
            Number(new URL(request.url).searchParams.get('limit') ?? 20) || 20
          ),
        })
    ),
    // Everyone's scores are always up to date in the demo
    http.get(
      `${base}/api/hive/sync`,
      () =>
        signedOut() ?? HttpResponse.json({ syncing: [] } satisfies SyncStatus)
    ),
    http.post(`${base}/api/hive/sync`, () =>
      HttpResponse.json(
        { queued: 0, upToDate: state.hive.length + 1 } satisfies SyncRequest,
        { status: 202 }
      )
    ),
    http.get(`${base}/api/hive/revenge`, ({ request }) => {
      const refused = signedOut();

      if (refused !== undefined) return refused;

      const url = new URL(request.url);
      const bee = url.searchParams.get('bee');

      if (bee !== null && !state.hive.includes(bee))
        return error(404, 'not_in_hive', 'This player is not in your hive');

      return HttpResponse.json(
        paginated(revenge(bee), url) satisfies RevengePage
      );
    }),
    http.get(`${base}/api/hive/trending`, ({ request }) => {
      const refused = signedOut();

      if (refused !== undefined) return refused;

      return HttpResponse.json({
        ...paginated(trending(), new URL(request.url)),
        days: TRENDING_DAYS,
      } satisfies TrendingPage);
    }),
    http.get(`${base}/api/hive/maps/:leaderboardId`, ({ params }) => {
      const refused = signedOut();

      if (refused !== undefined) return refused;

      const board = leaderboardOf(Number(params.leaderboardId));

      if (board === undefined)
        return error(
          404,
          'unknown_map',
          'Nobody tracked here has played this map'
        );

      const played = [state.playerId, ...state.hive]
        .flatMap((id) => {
          const found = scoreOn(id, board.id);

          return found === undefined
            ? []
            : [{ player: playerOf(id)!, score: found }];
        })
        .sort((a, b) => b.score.modifiedScore - a.score.modifiedScore);

      return HttpResponse.json({
        leaderboard: board,
        entries: played.map(
          ({ player, score }: { player: Player; score: Score }) => ({
            // The same score, the same place
            place:
              1 +
              played.filter(
                (other) => other.score.modifiedScore > score.modifiedScore
              ).length,
            isMe: player.id === state.playerId,
            player: {
              id: player.id,
              name: player.name,
              avatarUrl: player.avatarUrl,
              country: player.country,
            },
            score: {
              modifiedScore: score.modifiedScore,
              accuracy: score.accuracy,
              fullCombo: score.fullCombo,
              playedAt: score.playedAt,
            },
          })
        ),
      } satisfies MapRanking);
    }),
    http.get(`${base}/api/hive/:playerId/comparison`, ({ params, request }) => {
      const refused = signedOut();

      if (refused !== undefined) return refused;

      const id = String(params.playerId);

      if (!state.hive.includes(id))
        return error(404, 'not_in_hive', 'This player is not in your hive');

      const url = new URL(request.url);
      const filter = url.searchParams.get('filter');

      return HttpResponse.json(
        paginated(
          shared(id).filter(({ mine, theirs }) =>
            filter === 'losing'
              ? mine.modifiedScore < theirs.modifiedScore
              : filter === 'winning'
                ? mine.modifiedScore > theirs.modifiedScore
                : true
          ),
          url
        ) satisfies ComparisonPage
      );
    }),
  ];

  return {
    handlers,
    /** Back to the hive a visit starts with */
    reset: () => {
      state = initial();
    },
  };
};

export { createDemoHandlers, TRENDING_DAYS };
