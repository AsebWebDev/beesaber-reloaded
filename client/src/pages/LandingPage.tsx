import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useConfig } from '@/api/queries.ts';
import { signInAsDev, signInWithGoogle } from '@/auth/authClient.ts';
import { HexLogo } from '@/components/HexLogo.tsx';
import { Button, ErrorNote, NeonHeading, Spinner } from '@/components/ui.tsx';

/** What visitors see before they sign in */
const LandingPage = () => {
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

  return (
    <main
      data-testid="landing-page"
      className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-10 px-6 text-center"
    >
      <h1 className="font-neon text-6xl tracking-wide uppercase sm:text-8xl">
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

      <NeonHeading as="h2" color="yellow" className="text-xl">
        Find your hive
      </NeonHeading>
    </main>
  );
};

export { LandingPage };
