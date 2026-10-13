import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { ApiError } from './client.ts';

type Options = {
  /** Tests switch this off, so a failed request shows at once */
  retry?: boolean;
  /** How long an answer counts as fresh, in milliseconds */
  staleTime?: number;
};

/**
 * Drops everything that was loaded for the user who was signed in, and tells
 * the app that nobody is. What the server offers to everyone stays.
 */
const forgetUser = (queryClient: QueryClient) => {
  queryClient.setQueryData(['me'], null);
  queryClient.removeQueries({
    predicate: ({ queryKey }) =>
      queryKey[0] !== 'me' && queryKey[0] !== 'config',
  });
};

/**
 * The cache for server data, with the rules that hold for every request.
 *
 * Two answers of the server mean the same thing wherever they come from, so
 * they are handled here, once, instead of in every page:
 * - 401: the session has ended, for example because it ran out or was ended
 *   on another device. The app goes back to the landing page.
 * - `no_player_linked`: the account has no ScoreSaber profile any more. The
 *   app asks who the user is again, and shows the profile picker.
 */
const createQueryClient = ({
  retry = true,
  staleTime = 30_000,
}: Options = {}): QueryClient => {
  const onError = (error: unknown) => {
    if (!(error instanceof ApiError)) return;

    if (error.status === 401) forgetUser(queryClient);
    else if (error.code === 'no_player_linked')
      void queryClient.invalidateQueries({ queryKey: ['me'] });
  };

  const queryClient = new QueryClient({
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
    defaultOptions: {
      queries: {
        // Asking again does not help when the server said "no" (4xx). Only
        // retry when something may have been temporarily broken.
        retry: (failures, error) =>
          retry &&
          !(error instanceof ApiError && error.status < 500) &&
          failures < 2,
        staleTime,
      },
    },
  });

  return queryClient;
};

export { createQueryClient, forgetUser };
