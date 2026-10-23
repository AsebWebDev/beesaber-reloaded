import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';

import { useConfig } from '@/api/queries.ts';
import { signInAsDev, signInWithGoogle } from '@/auth/authClient.ts';
import { HexLogo } from '@/components/HexLogo.tsx';
import { Button, ErrorNote, NeonHeading, Spinner } from '@/components/ui.tsx';
import { useFocusOnMount } from '@/lib/useFocusOnMount.ts';
import { usePageTitle } from '@/lib/usePageTitle.ts';

/** What visitors see before they sign in */
const LandingPage = ({ takeFocus = false }: { takeFocus?: boolean }) => {
  const main = useRef<HTMLElement>(null);
  const queryClient = useQueryClient();
  const config = useConfig();
  const google = useMutation({ mutationFn: signInWithGoogle });
  const dev = useMutation({
    // Undefined in production builds, see authClient.ts
    mutationFn: () => signInAsDev?.() ?? Promise.resolve(),
    // Now signed in: ask the server again who we are
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  });
  const signIn = config.data?.signIn;
  const offersDevLogin = signInAsDev !== undefined && signIn?.devLogin === true;

  usePageTitle();
  useFocusOnMount(main, takeFocus);

  return (
    <main
      ref={main}
      data-testid="landing-page"
      tabIndex={-1}
      className="outline-none mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-10 px-6 py-10 text-center"
    >
      <p className="border-neon-red text-neon-red-core rounded border px-4 py-2">
        This version is wrong on purpose: rollback exercise.
      </p>

      {/* Grows with the screen, so the name fits on a phone in one line */}
      <h1 className="font-neon text-[clamp(2.25rem,13vw,6rem)] leading-none tracking-wide uppercase">
        <span className="glow-red">Bee</span>
        <span className="glow-blue">Saber</span>
      </h1>

      <HexLogo size={120} />

      <p className="max-w-xl text-lg text-slate-300">
        Compare your Beat Saber scores with your friends. See where they are
        ahead of you, and hear about it when someone beats your score.
      </p>

      <div className="flex flex-col items-center gap-3">
        {config.isPending && <Spinner />}
        {config.isError && <ErrorNote error={config.error} />}

        {signIn?.google === true && (
          <Button disabled={google.isPending} onClick={() => google.mutate()}>
            Sign in with Google
          </Button>
        )}
        {offersDevLogin && (
          <Button
            look="ghost"
            disabled={dev.isPending}
            onClick={() => dev.mutate()}
          >
            Dev Login
          </Button>
        )}
        {signIn !== undefined && !signIn.google && !offersDevLogin && (
          <p className="text-slate-400">
            No way to sign in is configured on the server.
          </p>
        )}

        {google.isError && <ErrorNote error={google.error} />}
        {dev.isError && <ErrorNote error={dev.error} />}
      </div>

      <NeonHeading as="p" color="yellow" className="text-xl">
        Find your hive
      </NeonHeading>
    </main>
  );
};

export { LandingPage };
