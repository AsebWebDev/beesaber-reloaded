import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { api, ApiError, unwrap } from './client.ts';

import type { InferResponseType } from 'hono/client';

/**
 * Every read and write of server data, as hooks.
 *
 * TanStack Query keeps the answers in a cache under a key. Components that
 * ask for the same key share one request. After a change, the keys it
 * affects are invalidated and their data is fetched again.
 */

type ComparisonFilter = 'all' | 'losing' | 'winning';
type ScoreSort = 'recent' | 'top';

// The shapes of the answers, taken from the server's route types
type Me = InferResponseType<typeof api.me.$get>;
type Player = NonNullable<Me['player']>;
type FoundPlayer = InferResponseType<
  typeof api.players.search.$get
>['items'][number];
type HiveMember = InferResponseType<typeof api.hive.$get>['items'][number];
type NewsItem = InferResponseType<typeof api.hive.news.$get>['items'][number];
type ScoreEntry = InferResponseType<
  (typeof api.players)[':id']['scores']['$get']
>['items'][number];
type Leaderboard = ScoreEntry['leaderboard'];
type ScorePage = InferResponseType<
  (typeof api.players)[':id']['scores']['$get']
>;
type ComparisonPage = InferResponseType<
  (typeof api.hive)[':playerId']['comparison']['$get']
>;
type Config = InferResponseType<typeof api.config.$get>;
type AddedBee = InferResponseType<typeof api.hive.$post>;
type SyncRequest = InferResponseType<typeof api.hive.sync.$post>;
type SyncStatus = InferResponseType<typeof api.hive.sync.$get>;
type ComparisonEntry = InferResponseType<
  (typeof api.hive)[':playerId']['comparison']['$get']
>['items'][number];

const PAGE_SIZE = 15;

/** How often to look whether the server has started fetching scores */
const SYNC_IDLE_INTERVAL_MS = 30_000;

/**
 * How long to wait before asking again whether a sync is done. Most finish
 * within seconds, so the first questions come quickly. One that takes
 * minutes, like the first fetch of a player with thousands of scores, is
 * asked about less and less often.
 */
const syncPollDelay = (elapsedMs: number): number => {
  if (elapsedMs < 20_000) return 1500;
  if (elapsedMs < 2 * 60_000) return 5000;

  return 15_000;
};
/** How often to look for news that arrived on their own */
const NEWS_INTERVAL_MS = 60_000;

/** True while a background job is fetching this player's scores */
const isSyncing = (player: { syncStartedAt: string | null }): boolean =>
  player.syncStartedAt !== null;

/** Which ways to sign in the server offers */
const useConfig = () =>
  useQuery({
    queryKey: ['config'],
    queryFn: () => unwrap(api.config.$get()),
    staleTime: Infinity,
  });

/**
 * The signed-in user with their ScoreSaber profile. `null` when nobody is
 * signed in, which is a normal state and not an error.
 */
const useMe = () =>
  useQuery({
    queryKey: ['me'],
    queryFn: async (): Promise<Me | null> => {
      try {
        return await unwrap(api.me.$get());
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;

        throw error;
      }
    },
    staleTime: 60_000,
  });

/** Picks the ScoreSaber profile to compare as. Fetches all its scores. */
const useLinkProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (playerId: string) =>
      unwrap(api.me.player.$put({ json: { playerId } })),
    // Everything shown depends on who "I" am, so start over
    onSuccess: () => queryClient.invalidateQueries(),
  });
};

/** Finds ScoreSaber players by name. Needs at least three characters. */
const usePlayerSearch = (name: string) =>
  useQuery({
    queryKey: ['players', 'search', name],
    queryFn: () => unwrap(api.players.search.$get({ query: { q: name } })),
    enabled: name.length >= 3,
    staleTime: 60_000,
  });

const useScores = (
  playerId: string,
  options: { page: number; search: string; sort: ScoreSort }
) =>
  useQuery({
    queryKey: ['players', playerId, 'scores', options],
    queryFn: () =>
      unwrap(
        api.players[':id'].scores.$get({
          param: { id: playerId },
          query: {
            page: String(options.page),
            limit: String(PAGE_SIZE),
            sort: options.sort,
            // An empty search box means "no filter"
            ...(options.search === '' ? {} : { search: options.search }),
          },
        })
      ),
  });

const useHive = () =>
  useQuery({
    queryKey: ['hive', 'members'],
    queryFn: () => unwrap(api.hive.$get()),
  });

const useNews = () =>
  useQuery({
    queryKey: ['hive', 'news'],
    queryFn: () => unwrap(api.hive.news.$get({ query: {} })),
    // The server learns about new scores on its own. Look in now and then.
    refetchInterval: NEWS_INTERVAL_MS,
  });

/**
 * Whose scores the server is fetching right now, out of me and my bees.
 *
 * This is the one thing the page keeps asking while it waits. The answer is
 * a handful of ids, where the hive with its records is a heavy query; asking
 * for that every second and a half was the old way.
 */
const useSyncStatus = () => {
  // When this browser first saw each player being fetched. The server says
  // when the fetch started, but by its own clock; a browser whose clock is a
  // few minutes off would ask far too rarely, or far too often.
  const firstSeen = useRef(new Map<string, number>());

  return useQuery({
    queryKey: ['hive', 'sync'],
    queryFn: () => unwrap(api.hive.sync.$get()),
    refetchInterval: ({ state }) => {
      const seen = firstSeen.current;
      const ids = (state.data?.syncing ?? []).map(({ playerId }) => playerId);
      const now = Date.now();

      for (const id of [...seen.keys()]) if (!ids.includes(id)) seen.delete(id);
      for (const id of ids) if (!seen.has(id)) seen.set(id, now);

      return ids.length === 0
        ? SYNC_IDLE_INTERVAL_MS
        : syncPollDelay(now - Math.min(...seen.values()));
    },
  });
};

/**
 * Whether scores of me or of a bee are being fetched right now.
 *
 * When the set of players being fetched changes, the places that show a
 * "fetching" mark are loaded again. When the last one is done, everything on
 * screen is, because the new scores change records, comparisons and news.
 */
const useSyncing = (): boolean => {
  const queryClient = useQueryClient();
  const { data } = useSyncStatus();
  const players = (data?.syncing ?? []).map(({ playerId }) => playerId);
  const current = players.sort().join(',');
  const previous = useRef(current);

  useEffect(() => {
    if (previous.current === current) return;

    previous.current = current;

    if (current === '') void queryClient.invalidateQueries();
    else {
      void queryClient.invalidateQueries({ queryKey: ['me'] });
      void queryClient.invalidateQueries({ queryKey: ['hive', 'members'] });
    }
  }, [current, queryClient]);

  return current !== '';
};

const useComparison = (
  playerId: string,
  options: { filter: ComparisonFilter; page: number },
  /** False when it is already known that there is nothing to compare */
  enabled = true
) =>
  useQuery({
    enabled,
    queryKey: ['hive', 'comparison', playerId, options],
    queryFn: () =>
      unwrap(
        api.hive[':playerId'].comparison.$get({
          param: { playerId },
          query: {
            page: String(options.page),
            limit: String(PAGE_SIZE),
            filter: options.filter,
          },
        })
      ),
  });

/** After any change to the hive, everything under the 'hive' key is stale */
const useHiveMutation = <Input>(
  mutationFn: (input: Input) => Promise<unknown>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hive'] }),
  });
};

/** Adds a player to my hive. Their scores are fetched in the background. */
const useAddBee = () =>
  useHiveMutation((playerId: string) =>
    unwrap(api.hive.$post({ json: { playerId } }))
  );

const useRemoveBee = () =>
  useHiveMutation(async (playerId: string) => {
    const response = await api.hive[':playerId'].$delete({
      param: { playerId },
    });

    if (!response.ok)
      throw new ApiError(
        response.status,
        'unknown',
        'Could not remove the bee'
      );
  });

/** Asks the server to look for new scores of me and all my bees */
const useSyncHive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => unwrap(api.hive.sync.$post()),
    // Pick up who is being fetched now. useSyncing takes it from there.
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['hive', 'sync'] }),
  });
};

export {
  isSyncing,
  PAGE_SIZE,
  useAddBee,
  useComparison,
  useConfig,
  useHive,
  useLinkProfile,
  useMe,
  useNews,
  usePlayerSearch,
  useRemoveBee,
  useScores,
  useSyncHive,
  useSyncing,
};
export type {
  AddedBee,
  ComparisonEntry,
  ComparisonFilter,
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
  ScoreSort,
  SyncRequest,
  SyncStatus,
};
