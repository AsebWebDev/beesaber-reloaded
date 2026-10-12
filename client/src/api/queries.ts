import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
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
type ComparisonEntry = InferResponseType<
  (typeof api.hive)[':playerId']['comparison']['$get']
>['items'][number];

const PAGE_SIZE = 15;

/** How often to ask again while the server is fetching someone's scores */
const POLL_WHILE_SYNCING_MS = 1500;
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
    // While my scores are being fetched, keep asking until they are done
    refetchInterval: ({ state }) =>
      state.data?.player != null && isSyncing(state.data.player)
        ? POLL_WHILE_SYNCING_MS
        : false,
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
    // Keep showing the old page while the next one loads
    placeholderData: keepPreviousData,
  });

const useHive = () =>
  useQuery({
    queryKey: ['hive', 'members'],
    queryFn: () => unwrap(api.hive.$get()),
    refetchInterval: ({ state }) =>
      state.data?.items.some(({ player }) => isSyncing(player)) === true
        ? POLL_WHILE_SYNCING_MS
        : false,
  });

const useNews = () =>
  useQuery({
    queryKey: ['hive', 'news'],
    queryFn: () => unwrap(api.hive.news.$get({ query: {} })),
    // The server learns about new scores on its own. Look in now and then.
    refetchInterval: NEWS_INTERVAL_MS,
  });

/**
 * Whether scores of me or of a bee are being fetched right now. When that
 * ends, everything on screen is fetched again, because the new scores change
 * records, comparisons and news.
 */
const useSyncing = (): boolean => {
  const queryClient = useQueryClient();
  const me = useMe();
  const hive = useHive();
  const syncing =
    (me.data?.player != null && isSyncing(me.data.player)) ||
    hive.data?.items.some(({ player }) => isSyncing(player)) === true;
  const wasSyncing = useRef(false);

  useEffect(() => {
    if (wasSyncing.current && !syncing) void queryClient.invalidateQueries();

    wasSyncing.current = syncing;
  }, [syncing, queryClient]);

  return syncing;
};

const useComparison = (
  playerId: string,
  options: { filter: ComparisonFilter; page: number }
) =>
  useQuery({
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
    placeholderData: keepPreviousData,
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
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['me'] }),
        queryClient.invalidateQueries({ queryKey: ['hive', 'members'] }),
      ]),
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
  ComparisonEntry,
  ComparisonFilter,
  FoundPlayer,
  HiveMember,
  Leaderboard,
  Me,
  NewsItem,
  Player,
  ScoreEntry,
  ScoreSort,
};
