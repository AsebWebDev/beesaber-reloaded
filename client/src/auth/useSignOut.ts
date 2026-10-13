import { useMutation, useQueryClient } from '@tanstack/react-query';

import { forgetUser } from '@/api/queryClient.ts';

import { signOut } from './authClient.ts';

/**
 * Signing out, for every place that offers it. Only once the server has
 * confirmed it does the app forget the user and show the landing page.
 */
const useSignOut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signOut,
    onSuccess: () => forgetUser(queryClient),
  });
};

export { useSignOut };
