import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import type {
  ComparisonEntry,
  FoundPlayer,
  HiveMember,
  Leaderboard,
  Me,
  NewsItem,
  Player,
  ScoreEntry,
} from '@/api/queries.ts';

/**
 * A stand-in for our API in the frontend tests. It keeps a little state
 * (who is signed in, who is in the hive) and answers the same paths with the
 * same shapes. The types come from the real server, so if an answer here
 * drifts from what the server sends, the type check complains.
 */

const player = (id: string, name: string): Player => ({
  id,
  name,
  country: 'DE',
  avatarUrl: `https://cdn.example/${id}.jpg`,
  rank: 1234,
  countryRank: 56,
  totalPp: 4321.5,
  totalPlayed: 475,
  inactive: false,
  profileSyncedAt: '2024-03-01T10:00:00.000Z',
  scoresSyncedAt: '2024-03-01T10:00:00.000Z',
  syncStartedAt: null,
  syncError: null,
});

const leaderboard = (id: number, songName: string): Leaderboard => ({
  id,
  mapHash: `HASH${id}`,
  songName,
  songSubName: '',
  songAuthorName: 'Some Artist',
  levelAuthorName: 'Some Mapper',
  coverUrl: `https://cdn.example/cover-${id}.png`,
  difficulty: 7,
  gameMode: 'SoloStandard',
  maxScore: 1_000_000,
  stars: 0,
  status: 'UNRANKED',
});

const score = (
  playerId: string,
  leaderboardId: number,
  modifiedScore: number
): ScoreEntry['score'] => ({
  playerId,
  leaderboardId,
  scoreSaberId: leaderboardId * 10,
  modifiedScore,
  unmodifiedScore: modifiedScore,
  accuracy: 0.9,
  pp: 0,
  rank: 42,
  mods: [],
  fullCombo: false,
  missedNotes: 1,
  badCuts: 0,
  maxCombo: 300,
  playedAt: '2024-02-01T10:00:00.000Z',
});

const ME = player('1001', 'myself');
const BEE = player('2002', 'buzz');
const OTHER = player('3003', 'buzzkill');

const MONSTER = leaderboard(1, 'Monster');
const SUPERSTAR = leaderboard(2, 'Superstar');

// I lead on Monster, the bee leads on Superstar
const SHARED: ComparisonEntry[] = [
  {
    leaderboard: MONSTER,
    mine: score(ME.id, 1, 900_000),
    theirs: score(BEE.id, 1, 800_000),
  },
  {
    leaderboard: SUPERSTAR,
    mine: score(ME.id, 2, 400_000),
    theirs: score(BEE.id, 2, 500_000),
  },
];

const MY_SCORES: ScoreEntry[] = SHARED.map(({ leaderboard: board, mine }) => ({
  leaderboard: board,
  score: mine,
}));

type State = {
  hive: string[];
  news: NewsItem[];
  /** The ScoreSaber profile the account compares as */
  playerId: string | null;
  /** How many more times the hive reports its bee as being fetched */
  pollsUntilSynced: number;
  /** What a click on "Sync scores" queues */
  queuedBySync: number;
  signedIn: boolean;
  signIn: { devLogin: boolean; google: boolean };
};

const initial = (): State => ({
  hive: [],
  news: [],
  playerId: null,
  pollsUntilSynced: 0,
  queuedBySync: 0,
  signedIn: false,
  signIn: { devLogin: true, google: false },
});

let state = initial();

const error = (status: number, code: string, message: string) =>
  HttpResponse.json({ error: { code, message } }, { status });

const unauthorized = () => error(401, 'unauthorized', 'Not signed in');

const me = (): Me => ({
  user: {
    id: 'user-1',
    email: 'dev@beesaber.local',
    name: 'Dev',
    image: null,
    playerId: state.playerId,
  },
  player: state.playerId === null ? null : ME,
});

const member = (): HiveMember => ({
  player:
    state.pollsUntilSynced-- > 0
      ? { ...BEE, syncStartedAt: '2024-03-01T10:00:00.000Z' }
      : BEE,
  addedAt: '2024-03-01T10:00:00.000Z',
  shared: 2,
  winning: 1,
  losing: 1,
});

const paginated = <Item>(items: Item[], url: URL) => {
  const page = Number(url.searchParams.get('page') ?? 1);
  const limit = Number(url.searchParams.get('limit') ?? 20);

  return {
    items: items.slice((page - 1) * limit, page * limit),
    page,
    limit,
    total: items.length,
    totalPages: Math.ceil(items.length / limit),
  };
};

const session = () => ({
  user: { id: 'user-1', email: 'dev@beesaber.local', name: 'Dev' },
  session: { id: 'session-1', token: 'token' },
});

const server = setupServer(
  http.get('/api/config', () => HttpResponse.json({ signIn: state.signIn })),

  // What Better Auth's browser client calls
  http.post('/api/auth/sign-in/email', () => {
    state.signedIn = true;

    return HttpResponse.json({ ...session(), redirect: false });
  }),
  http.post('/api/auth/sign-out', () => {
    state.signedIn = false;

    return HttpResponse.json({ success: true });
  }),
  http.get('/api/auth/get-session', () =>
    HttpResponse.json(state.signedIn ? session() : null)
  ),

  http.get('/api/me', () =>
    state.signedIn ? HttpResponse.json(me()) : unauthorized()
  ),
  http.put('/api/me/player', async ({ request }) => {
    const body = (await request.json()) as { playerId: string };

    state.playerId = body.playerId;

    return HttpResponse.json(me());
  }),

  http.get('/api/players/search', ({ request }) => {
    const name = new URL(request.url).searchParams.get('q') ?? '';
    const items: FoundPlayer[] = [ME, BEE, OTHER]
      .filter((found) => found.name.includes(name))
      .map(({ avatarUrl, country, id, name: foundName, rank }) => ({
        id,
        name: foundName,
        country,
        avatarUrl,
        rank,
      }));

    return HttpResponse.json({ items });
  }),
  http.get('/api/players/:id/scores', ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.toLowerCase();
    const sorted =
      url.searchParams.get('sort') === 'top'
        ? [...MY_SCORES].sort(
            (a, b) => b.score.modifiedScore - a.score.modifiedScore
          )
        : MY_SCORES;

    return HttpResponse.json(
      paginated(
        sorted.filter(
          (entry) =>
            search === undefined ||
            entry.leaderboard.songName.toLowerCase().includes(search)
        ),
        url
      )
    );
  }),

  http.get('/api/hive', () =>
    HttpResponse.json({ items: state.hive.map(() => member()) })
  ),
  http.post('/api/hive', async ({ request }) => {
    const body = (await request.json()) as { playerId: string };

    if (!state.hive.includes(body.playerId)) state.hive.push(body.playerId);

    return HttpResponse.json({ player: BEE }, { status: 201 });
  }),
  http.delete('/api/hive/:playerId', ({ params }) => {
    state.hive = state.hive.filter((id) => id !== params.playerId);

    return new HttpResponse(null, { status: 204 });
  }),
  http.get('/api/hive/news', () => HttpResponse.json({ items: state.news })),
  http.post('/api/hive/sync', () =>
    HttpResponse.json(
      { queued: state.queuedBySync, upToDate: 1 - state.queuedBySync },
      { status: 202 }
    )
  ),
  http.get('/api/hive/:playerId/comparison', ({ request }) => {
    const url = new URL(request.url);
    const filter = url.searchParams.get('filter');

    return HttpResponse.json(
      paginated(
        SHARED.filter(({ mine, theirs }) =>
          filter === 'losing'
            ? mine.modifiedScore < theirs.modifiedScore
            : filter === 'winning'
              ? mine.modifiedScore > theirs.modifiedScore
              : true
        ),
        url
      )
    );
  })
);

const fakeApi = {
  server,
  reset: () => {
    state = initial();
  },
  /** Puts the fake into a given situation before the app renders */
  set: (changes: Partial<State>) => {
    state = { ...state, ...changes };
  },
  /** A signed-in user who has picked their profile */
  signedInAs: (changes: Partial<State> = {}) => {
    state = { ...state, signedIn: true, playerId: ME.id, ...changes };
  },
  news: (): NewsItem => ({
    event: {
      id: 1,
      playerId: BEE.id,
      leaderboardId: SUPERSTAR.id,
      previousScore: 300_000,
      newScore: 500_000,
      playedAt: '2024-02-01T10:00:00.000Z',
      isNews: true,
    },
    player: { id: BEE.id, name: BEE.name, avatarUrl: BEE.avatarUrl },
    leaderboard: SUPERSTAR,
    myScore: 400_000,
  }),
  BEE,
  ME,
};

export { fakeApi };
