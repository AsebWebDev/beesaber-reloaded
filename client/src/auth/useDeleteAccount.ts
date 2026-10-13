import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api, ApiError } from '@/api/client.ts';
import { forgetUser } from '@/api/queryClient.ts';

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

      if (!response.ok)
        throw new ApiError(
          response.status,
          'unknown',
          'Deleting the account failed. It still exists, please try again.'
        );

      // The session went with the account, but the browser still holds its
      // cookie. Signing out makes it drop the cookie. If that fails, the
      // cookie stays and opens nothing.
      await signOut().catch(() => {});
    },
    onSuccess: () => forgetUser(queryClient),
  });
};

export { useDeleteAccount };
