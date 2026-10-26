import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { useConfig } from '@/api/queries.ts';
import { signInAsDev, signInWithGoogle } from '@/auth/authClient.ts';
import { HexLogo } from '@/components/HexLogo.tsx';
import { Button, ErrorNote, NeonHeading, Spinner } from '@/components/ui.tsx';
import { useFocusOnMount } from '@/lib/useFocusOnMount.ts';
import { usePageTitle } from '@/lib/usePageTitle.ts';

/** What visitors see before they sign in */
const LandingPage = ({ takeFocus = false }: { takeFocus?: boolean }) => {
  const { t } = useTranslation();
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
      {/* Grows with the screen, so the name fits on a phone in one line */}
      <h1 className="font-neon text-[clamp(2.25rem,13vw,6rem)] leading-none tracking-wide uppercase">
        <span className="glow-red">Bee</span>
        <span className="glow-blue">Saber</span>
      </h1>

      <HexLogo size={120} />

      <p className="max-w-xl text-lg text-slate-300">{t('landing.tagline')}</p>

      {/* Strangers who try to sign in get a bare refusal from Google, since
          sign-in is limited to invited accounts. This says why beforehand. */}
      <p className="max-w-xl text-sm text-slate-400">
        <Trans
          i18nKey="landing.private"
          components={{ strong: <strong className="text-slate-300" /> }}
        />
      </p>

      <div className="flex flex-col items-center gap-3">
        {config.isPending && <Spinner />}
        {config.isError && <ErrorNote error={config.error} />}

        {signIn?.google === true && (
          <Button disabled={google.isPending} onClick={() => google.mutate()}>
            {t('landing.google')}
          </Button>
        )}
        {offersDevLogin && (
          <Button
            look="ghost"
            disabled={dev.isPending}
            onClick={() => dev.mutate()}
          >
            {t('landing.devLogin')}
          </Button>
        )}
        {signIn !== undefined && !signIn.google && !offersDevLogin && (
          <p className="text-slate-400">{t('landing.noSignIn')}</p>
        )}

        {google.isError && <ErrorNote error={google.error} />}
        {dev.isError && <ErrorNote error={dev.error} />}
      </div>

      <NeonHeading as="p" color="yellow" className="text-xl">
        {t('landing.slogan')}
      </NeonHeading>

      {/* Every score and player comes from ScoreSaber, so it says so. The
          name plays on Beat Saber, so it says whose game that is. */}
      <p className="max-w-xl text-xs text-slate-400">
        <Trans
          i18nKey="landing.credits"
          components={{
            // The link's text comes from the translation
            scoresaber: (
              <a href="https://scoresaber.com" className="underline" />
            ),
          }}
        />
      </p>
    </main>
  );
};

export { LandingPage };
