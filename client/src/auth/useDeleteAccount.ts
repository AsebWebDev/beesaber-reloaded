import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api, apiErrorOf } from '@/api/client.ts';
import { forgetUser } from '@/api/queryClient.ts';
import { LocalizedError } from '@/i18n/errors.ts';

import { signOut } from './authClient.ts';

/**
 * Deleting the account. Only once the server has confirmed it does the app
 * forget the user and show the landing page.
 */
const useDeleteAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.me.$delete();

      if (!response.ok) {
        const error = await apiErrorOf(response);

        // A session that has ended is handled like everywhere else, by
        // going back to the landing page (queryClient.ts)
        if (error.status === 401) throw error;

        // Whatever else went wrong, what matters is that nothing was deleted
        throw new LocalizedError('deleteAccountFailed');
      }

      // The session went with the account, but the browser still holds its
      // cookie. Signing out makes it drop the cookie. If that fails, the
      // cookie stays and opens nothing.
      await signOut().catch(() => {});
    },
    onSuccess: () => forgetUser(queryClient),
  });
};

export { useDeleteAccount };
