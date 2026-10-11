import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

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
    // Keep showing the old page while the next one loads
    placeholderData: keepPreviousData,
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
  });

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

/** Adds a player to my hive. Fetches all their scores, which can take a while. */
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

/** Fetches new scores for me and all my bees from ScoreSaber */
const useSyncHive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => unwrap(api.hive.sync.$post()),
    // New scores change the hive, my own scores and my profile
    onSuccess: () => queryClient.invalidateQueries(),
  });
};

export {
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
