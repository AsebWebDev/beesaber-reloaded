import type { Leaderboard, Player, ScoreEntry } from '@/api/queries.ts';

/**
 * The made-up world of the demo: players, maps and scores that look like a
 * real hive, without anyone real in it. Names, songs and mappers are
 * invented; the pictures are drawings that ship with the demo.
 *
 * The scores come from a fixed seed, so every visit sees the same hive,
 * and their dates count back from the visit, so the hive is always active.
 */

type Score = ScoreEntry['score'];

/** Where the demo's pictures are served, next to the demo itself */
const PICTURES = '/demo/pictures';

const DAY = 24 * 60 * 60 * 1000;

/**
 * A small random number generator with a seed (mulberry32): the same
 * numbers in every browser and every test run
 */
const seeded = (seed: number) => {
  let state = seed;

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
};

const random = seeded(2026);

const player = (
  id: string,
  name: string,
  country: string,
  rank: number,
  picture: number
): Player => ({
  id,
  name,
  country,
  avatarUrl: `${PICTURES}/bee-${picture}.svg`,
  rank,
  countryRank: Math.max(1, Math.round(rank / 18)),
  // Roughly how ScoreSaber's points fall off with the rank
  totalPp: Math.round(14_000 * Math.exp(-rank / 9_000) * 100) / 100,
  totalPlayed: 200 + Math.round(random() * 900),
  inactive: false,
  profileSyncedAt: new Date(Date.now() - DAY / 6).toISOString(),
  scoresSyncedAt: new Date(Date.now() - DAY / 6).toISOString(),
  syncStartedAt: null,
  syncError: null,
  syncFailures: 0,
  syncFailedAt: null,
});

/** The visitor of the demo */
const ME = player('76561198400000001', 'Honeycomb', 'DE', 4_812, 1);

/** The hive the visitor starts with */
const BEES = [
  player('76561198400000002', 'Queen Bea', 'SE', 1_204, 2),
  player('76561198400000003', 'Waggle Dance', 'FR', 3_377, 3),
  player('76561198400000004', 'Pollen Pete', 'GB', 6_590, 4),
  player('76561198400000005', 'Nectar Nova', 'JP', 9_841, 5),
];

/** Found by the search, not in the hive yet, so adding a bee can be tried */
const STRANGERS = [
  player('76561198400000006', 'Drone Strike', 'US', 2_655, 6),
  player('76561198400000007', 'Hexagon Hana', 'KR', 7_408, 7),
];

const PLAYERS = [ME, ...BEES, ...STRANGERS];

const SONGS: [song: string, artist: string, mapper: string][] = [
  ['Neon Hive', 'Glasswing', 'combmaker'],
  ['Wax and Wane', 'Lunar Apiary', 'stingray'],
  ['Honey Drip', 'Golden Hour', 'Yellowjacket'],
  ['Swarm Theory', 'The Workers', 'hexsaw'],
  ['Nectar Rush', 'Glasswing', 'Pollinator'],
  ['Comb Over', 'Bad Apiary', 'combmaker'],
  ['Royal Jelly', 'Queen Size', 'stingray'],
  ['Flight of the Drones', 'Rimsky Beats', 'hexsaw'],
  ['Stinger', 'Black and Yellow', 'Yellowjacket'],
  ['Sunflower Field', 'Meadow', 'Pollinator'],
  ['Buzzline', 'The Workers', 'stingray'],
  ['Midnight Bloom', 'Lunar Apiary', 'nightmoth'],
  ['Propolis', 'Bad Apiary', 'hexsaw'],
  ['Waggle', 'Glasswing', 'combmaker'],
  ['Lavender Haze Run', 'Meadow', 'nightmoth'],
  ['Six Sided', 'Hexagonal', 'hexsaw'],
  ['Pollen Count', 'Golden Hour', 'Pollinator'],
  ['Clover Kick', 'Meadow', 'stingray'],
  ['Amber Light', 'Golden Hour', 'Yellowjacket'],
  ['Colony Collapse', 'Black and Yellow', 'nightmoth'],
  ['Wildflower', 'Queen Size', 'Pollinator'],
  ['Hive Mind', 'The Workers', 'combmaker'],
  ['Nightshade', 'Lunar Apiary', 'nightmoth'],
  ['Drone Zone', 'Rimsky Beats', 'hexsaw'],
  ['Beeswing', 'Glasswing', 'stingray'],
  ['Orchard Run', 'Meadow', 'Pollinator'],
  ['Smoke Signal', 'Bad Apiary', 'Yellowjacket'],
  ['Queen of the Comb', 'Queen Size', 'combmaker'],
  ['Thistle', 'Meadow', 'nightmoth'],
  ['Golden Ratio', 'Hexagonal', 'hexsaw'],
  ['Pollinate', 'Golden Hour', 'Pollinator'],
  ['Bumble Bounce', 'Black and Yellow', 'stingray'],
  ['Nocturne for Bees', 'Lunar Apiary', 'nightmoth'],
  ['Heatwave Hum', 'Rimsky Beats', 'Yellowjacket'],
  ['Last Dance of Summer', 'Queen Size', 'combmaker'],
  ['Hexadecimal', 'Hexagonal', 'hexsaw'],
];

/** Beat Saber's difficulties: Easy 1, Normal 3, Hard 5, Expert 7, Expert+ 9 */
const DIFFICULTIES = [5, 7, 7, 9, 9];

const LEADERBOARDS: Leaderboard[] = SONGS.map(([song, artist, mapper], i) => {
  const ranked = random() < 0.6;
  const notes = 450 + Math.round(random() * 900);

  return {
    id: 410_000 + i * 37,
    mapHash: (0xbee0000 + i).toString(16).toUpperCase().padStart(40, '0'),
    songName: song,
    songSubName: '',
    songAuthorName: artist,
    levelAuthorName: mapper,
    coverUrl: `${PICTURES}/cover-${(i % 8) + 1}.svg`,
    difficulty: DIFFICULTIES[i % DIFFICULTIES.length] ?? 7,
    gameMode: 'SoloStandard',
    // Beat Saber's maximum: 115 points a note, times the combo multiplier
    maxScore: notes * 920 - 7_245,
    stars: ranked ? Math.round((4 + random() * 7) * 100) / 100 : 0,
    status: ranked ? 'RANKED' : 'UNRANKED',
  };
});

/** How well each player plays: their usual accuracy, and how often they play */
const SKILL: Record<string, { accuracy: number; plays: number }> = {
  [ME.id]: { accuracy: 0.912, plays: 0.8 },
  [BEES[0]!.id]: { accuracy: 0.922, plays: 0.7 },
  [BEES[1]!.id]: { accuracy: 0.915, plays: 0.65 },
  [BEES[2]!.id]: { accuracy: 0.905, plays: 0.6 },
  [BEES[3]!.id]: { accuracy: 0.893, plays: 0.55 },
  [STRANGERS[0]!.id]: { accuracy: 0.918, plays: 0.6 },
  [STRANGERS[1]!.id]: { accuracy: 0.9, plays: 0.5 },
};

/**
 * The last maps of the list are new: only the bees have played them, all
 * within the last days, for the list of what the hive is playing
 */
const NEW_MAPS = 5;

const score = (
  playerId: string,
  board: Leaderboard,
  accuracy: number,
  daysAgo: number
): Score => {
  const fullCombo = accuracy > 0.92 && random() < 0.5;

  return {
    playerId,
    leaderboardId: board.id,
    scoreSaberId: board.id * 10 + Number(playerId.slice(-1)),
    modifiedScore: Math.round(board.maxScore * accuracy),
    unmodifiedScore: Math.round(board.maxScore * accuracy),
    accuracy: Math.round(accuracy * 10_000) / 10_000,
    pp:
      board.status === 'RANKED'
        ? Math.round(board.stars * 42 * accuracy ** 6 * 100) / 100
        : 0,
    rank: 1 + Math.round(random() * 400),
    mods: [],
    fullCombo,
    missedNotes: fullCombo ? 0 : 1 + Math.round(random() * 6),
    badCuts: fullCombo ? 0 : Math.round(random() * 3),
    maxCombo: Math.round(board.maxScore / 920 / (fullCombo ? 1 : 2.5)),
    playedAt: new Date(
      Date.now() - daysAgo * DAY - Math.round(random() * DAY)
    ).toISOString(),
  };
};

/** Every score of every player, by player id */
const SCORES: Record<string, Score[]> = Object.fromEntries(
  PLAYERS.map(({ id }) => {
    const { accuracy, plays } = SKILL[id]!;
    const isMe = id === ME.id;

    return [
      id,
      LEADERBOARDS.flatMap((board, index) => {
        const isNew = index >= LEADERBOARDS.length - NEW_MAPS;

        if (isNew ? isMe || random() < 0.4 : random() > plays) return [];

        // Up to three points around the player's usual accuracy
        const played = Math.min(0.985, accuracy + (random() - 0.5) * 0.06);
        const daysAgo = isNew ? random() * 10 : random() * 90;

        return [score(id, board, played, daysAgo)];
      }),
    ];
  })
);

const leaderboardOf = (id: number) =>
  LEADERBOARDS.find((board) => board.id === id);

export { BEES, leaderboardOf, LEADERBOARDS, ME, PLAYERS, SCORES, STRANGERS };
