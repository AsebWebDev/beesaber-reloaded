import { delay, http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import type {
  AddedBee,
  ComparisonEntry,
  ComparisonPage,
  Config,
  FoundPlayer,
  HiveMember,
  Leaderboard,
  Me,
  NewsItem,
  Player,
  ScoreEntry,
  ScorePage,
  SyncRequest,
  SyncStatus,
} from '@/api/queries.ts';

/**
 * A stand-in for our API in the frontend tests. It keeps a little state
 * (who is signed in, who is in the hive) and answers the same paths with the
 * same shapes. Every answer of our own API is typed with the type of the
 * real route, so if one here drifts from what the server sends, the type
 * check complains. The answers under /api/auth are Better Auth's and are
 * not checked that way.
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
  syncFailures: 0,
  syncFailedAt: null,
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

/** The answers a test can make fail */
type Failing = 'comparison' | 'hive' | 'me' | 'news' | 'scores';

type State = {
  /**
   * The local test account: there already, created on first sign-in, or
   * refused by a server that has the test sign-in switched off
   */
  devAccount: 'exists' | 'missing' | 'refused';
  /** More scores of mine than the two every test has, to fill pages */
  extraScores: number;
  /** How often the browser was sent off to Google */
  googleSignIns: number;
  /** Makes the server fail to start a sign-in with Google */
  googleFails: boolean;
  /** Answers that fail, with the HTTP status they fail with */
  failures: Partial<Record<Failing, number>>;
  hive: string[];
  news: NewsItem[];
  /** The ScoreSaber profile the account compares as */
  playerId: string | null;
  /** How long lists of scores take to answer, in milliseconds */
  listDelayMs: number;
  /** How many more times the server says my own scores are being fetched */
  myPollsUntilSynced: number;
  /** How many more times the server says the bee is being fetched */
  pollsUntilSynced: number;
  /** Makes the server refuse to sign out, as it would when it is down */
  signOutFails: boolean;
  /** What a click on "Sync scores" queues */
  queuedBySync: number;
  signedIn: boolean;
  signIn: { devLogin: boolean; google: boolean };
};

const initial = (): State => ({
  devAccount: 'exists',
  extraScores: 0,
  googleFails: false,
  googleSignIns: 0,
  failures: {},
  hive: [],
  listDelayMs: 0,
  myPollsUntilSynced: 0,
  news: [],
  playerId: null,
  pollsUntilSynced: 0,
  queuedBySync: 0,
  signedIn: false,
  signOutFails: false,
  signIn: { devLogin: true, google: false },
});

let state = initial();

/**
 * My scores: the two shared maps, and as many more as the test asked for.
 * None at all while they are still being fetched from ScoreSaber.
 */
const myScores = (): ScoreEntry[] =>
  state.myPollsUntilSynced > 0
    ? []
    : [
        ...MY_SCORES,
        ...Array.from({ length: state.extraScores }, (_, index) => ({
          leaderboard: leaderboard(100 + index, `Extra song ${index + 1}`),
          score: score(ME.id, 100 + index, 1000 - index),
        })),
      ];

const error = (status: number, code: string, message: string) =>
  HttpResponse.json({ error: { code, message } }, { status });

const unauthorized = () => error(401, 'unauthorized', 'Not signed in');

/**
 * What stands between a request and its answer, like on the real server:
 * no answer without a session, and none when the test says this one fails.
 */
const refusal = (name?: Failing) => {
  if (!state.signedIn) return unauthorized();

  const status = name === undefined ? undefined : state.failures[name];

  return status === undefined
    ? undefined
    : error(status, 'internal_error', 'The server is having trouble');
};

const me = (): Me => {
  const linked =
    state.playerId === null
      ? null
      : ([ME, BEE, OTHER].find(({ id }) => id === state.playerId) ?? ME);

  return {
    user: {
      id: 'user-1',
      email: 'dev@beesaber.local',
      name: 'Dev',
      image: null,
      playerId: state.playerId,
    },
    player:
      linked !== null && state.myPollsUntilSynced > 0
        ? { ...linked, syncStartedAt: '2024-03-01T10:00:00.000Z' }
        : linked,
  };
};

const member = (): HiveMember => ({
  player:
    state.pollsUntilSynced > 0
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
  http.get('/api/config', () =>
    HttpResponse.json({ signIn: state.signIn } satisfies Config)
  ),

  // What Better Auth's browser client calls
  http.post('/api/auth/sign-in/email', () => {
    if (state.devAccount !== 'exists')
      return HttpResponse.json(
        { code: 'INVALID_EMAIL_OR_PASSWORD', message: 'Invalid email' },
        { status: 401 }
      );

    state.signedIn = true;

    return HttpResponse.json({ ...session(), redirect: false });
  }),
  http.post('/api/auth/sign-up/email', () => {
    if (state.devAccount === 'refused')
      return HttpResponse.json(
        { message: 'Email and password sign up is not enabled' },
        { status: 400 }
      );

    state.devAccount = 'exists';
    state.signedIn = true;

    return HttpResponse.json(session());
  }),
  http.post('/api/auth/sign-in/social', () => {
    if (state.googleFails)
      return HttpResponse.json(
        { message: 'Google did not answer' },
        { status: 500 }
      );

    state.googleSignIns += 1;

    // The real server answers with Google's address and `redirect: true`,
    // and the browser leaves the page. A test has nowhere to go.
    return HttpResponse.json({
      url: 'https://accounts.google.test/sign-in',
      redirect: false,
    });
  }),
  http.post('/api/auth/sign-out', () => {
    if (state.signOutFails)
      return HttpResponse.json({ message: 'Server error' }, { status: 500 });

    state.signedIn = false;

    return HttpResponse.json({ success: true });
  }),
  http.get('/api/auth/get-session', () =>
    HttpResponse.json(state.signedIn ? session() : null)
  ),

  http.get('/api/me', () => refusal('me') ?? HttpResponse.json(me())),
  http.delete('/api/me', () => {
    const refused = refusal();

    if (refused !== undefined) return refused;

    state.signedIn = false;
    state.devAccount = 'missing';

    return new HttpResponse(null, { status: 204 });
  }),
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
  http.get('/api/players/:id/scores', async ({ request }) => {
    await delay(state.listDelayMs);

    const refused = refusal('scores');

    if (refused !== undefined) return refused;

    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.toLowerCase();
    const all = myScores();
    const sorted =
      url.searchParams.get('sort') === 'top'
        ? [...all].sort((a, b) => b.score.modifiedScore - a.score.modifiedScore)
        : all;

    return HttpResponse.json(
      paginated(
        sorted.filter(
          (entry) =>
            search === undefined ||
            entry.leaderboard.songName.toLowerCase().includes(search)
        ),
        url
      ) satisfies ScorePage
    );
  }),

  http.get(
    '/api/hive',
    () =>
      refusal('hive') ??
      HttpResponse.json({ items: state.hive.map(() => member()) })
  ),
  http.post('/api/hive', async ({ request }) => {
    const body = (await request.json()) as { playerId: string };

    if (!state.hive.includes(body.playerId)) state.hive.push(body.playerId);

    return HttpResponse.json({ player: BEE } satisfies AddedBee, {
      status: 201,
    });
  }),
  http.delete('/api/hive/:playerId', ({ params }) => {
    state.hive = state.hive.filter((id) => id !== params.playerId);

    return new HttpResponse(null, { status: 204 });
  }),
  http.get(
    '/api/hive/news',
    () => refusal('news') ?? HttpResponse.json({ items: state.news })
  ),
  http.get('/api/hive/sync', () => {
    const refused = refusal();

    if (refused !== undefined) return refused;

    // Long ago on purpose. How often the page asks must not depend on
    // comparing the server's clock with the browser's.
    const since = '2024-03-01T10:00:00.000Z';
    const syncing = [
      ...(state.myPollsUntilSynced > 0 ? [{ playerId: ME.id, since }] : []),
      ...(state.hive.length > 0 && state.pollsUntilSynced > 0
        ? [{ playerId: BEE.id, since }]
        : []),
    ];

    // Every question brings the end of the sync one step closer
    state.myPollsUntilSynced = Math.max(0, state.myPollsUntilSynced - 1);
    state.pollsUntilSynced = Math.max(0, state.pollsUntilSynced - 1);

    return HttpResponse.json({ syncing } satisfies SyncStatus);
  }),
  http.post('/api/hive/sync', () =>
    HttpResponse.json(
      {
        queued: state.queuedBySync,
        upToDate: 1 - state.queuedBySync,
      } satisfies SyncRequest,
      { status: 202 }
    )
  ),
  http.get('/api/hive/:playerId/comparison', async ({ request }) => {
    await delay(state.listDelayMs);

    const refused = refusal('comparison');

    if (refused !== undefined) return refused;

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
      ) satisfies ComparisonPage
    );
  })
);

const fakeApi = {
  server,
  reset: () => {
    state = initial();
  },
  /** What the fake has seen and been told so far */
  state: (): Readonly<State> => state,
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
    },
    player: { id: BEE.id, name: BEE.name, avatarUrl: BEE.avatarUrl },
    leaderboard: SUPERSTAR,
    myScore: 400_000,
    theirScore: 500_000,
  }),
  BEE,
  ME,
};

export { fakeApi };
