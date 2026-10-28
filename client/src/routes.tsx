import { useEffect, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Link, useRouteError } from 'react-router';

import { useMe } from '@/api/queries.ts';
import { useSignOut } from '@/auth/useSignOut.ts';
import {
  Button,
  EmptyState,
  ErrorNote,
  NeonHeading,
  Spinner,
} from '@/components/ui.tsx';
import { AppLayout } from '@/layout/AppLayout.tsx';
import { useFocusOnMount } from '@/lib/useFocusOnMount.ts';
import { usePageTitle } from '@/lib/usePageTitle.ts';
import { ComparisonPage } from '@/pages/ComparisonPage.tsx';
import { DashboardPage } from '@/pages/DashboardPage.tsx';
import { HivePage } from '@/pages/HivePage.tsx';
import { LandingPage } from '@/pages/LandingPage.tsx';
import { MapPage } from '@/pages/MapPage.tsx';
import { OnboardingPage } from '@/pages/OnboardingPage.tsx';
import { ProfilePage } from '@/pages/ProfilePage.tsx';
import { RevengePage } from '@/pages/RevengePage.tsx';
import { TrendingPage } from '@/pages/TrendingPage.tsx';

import type { RouteObject } from 'react-router';
import type { Player } from '@/api/queries.ts';

/** Shown when the app cannot find out who is signed in */
const LoadError = ({
  error,
  onRetry,
  takeFocus,
}: {
  error: unknown;
  onRetry: () => void;
  takeFocus: boolean;
}) => {
  const { t } = useTranslation();
  const logout = useSignOut();
  const main = useRef<HTMLElement>(null);

  useFocusOnMount(main, takeFocus);

  return (
    <main
      ref={main}
      tabIndex={-1}
      className="mx-auto max-w-md space-y-4 px-6 py-16 outline-none"
    >
      <ErrorNote error={error} onRetry={onRetry} />
      {logout.isError && <ErrorNote error={logout.error} />}
      <Button
        look="ghost"
        disabled={logout.isPending}
        onClick={() => logout.mutate()}
      >
        {t('common.signOut')}
      </Button>
    </main>
  );
};

/**
 * Decides what a visitor gets to see, whatever URL they opened:
 * - not signed in: the landing page
 * - signed in without a ScoreSaber profile: the profile picker
 * - otherwise: the app, with the page the URL asks for
 *
 * This is convenience, not protection. The server checks every request
 * itself; someone who gets past this sees empty pages and error messages.
 *
 * What we know about the user is used for as long as we know it. The
 * question "who am I" is asked again in the background now and then; when
 * that fails once, say on a train in a tunnel, the app stays as it is.
 */
const Gate = () => {
  const me = useMe();
  const screen =
    me.data === undefined
      ? me.isError
        ? 'error'
        : 'loading'
      : me.data === null
        ? 'landing'
        : me.data.player === null
          ? 'onboarding'
          : 'app';
  // Which screen is shown, and which one it replaced
  const [trail, setTrail] = useState<{ before?: string; now: string }>({
    now: screen,
  });

  if (trail.now !== screen) setTrail({ before: trail.now, now: screen });

  // Signing in, picking a profile and signing out each replace everything
  // on screen, so the new screen takes the focus. The first screen of a
  // visit does not; there the browser starts at the top, as on any page.
  const takeFocus = trail.before !== undefined && trail.before !== 'loading';

  if (me.data === undefined)
    return me.isError ? (
      <LoadError
        error={me.error}
        onRetry={() => void me.refetch()}
        takeFocus={takeFocus}
      />
    ) : (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );

  if (me.data === null) return <LandingPage takeFocus={takeFocus} />;
  if (me.data.player === null) return <OnboardingPage takeFocus={takeFocus} />;

  return <AppLayout player={me.data.player} takeFocus={takeFocus} />;
};

/** The profile page needs the player. Inside the gate there always is one. */
const Profile = () => {
  const player: Player | null | undefined = useMe().data?.player;

  return player == null ? null : <ProfilePage player={player} />;
};

const NotFound = () => {
  const { t } = useTranslation();

  usePageTitle(t('notFound.title'));

  return (
    <EmptyState>
      <Trans
        i18nKey="notFound.text"
        components={{
          home: <Link to="/" className="text-neon-yellow-core underline" />,
        }}
      />
    </EmptyState>
  );
};

/**
 * The last line of defence: shown when a page throws while it is drawn, for
 * example because the server sent something this code did not expect.
 * Without it the visitor would get the router's own error screen, with a
 * stack trace and no way on.
 *
 * It uses nothing but plain HTML and a reload. Whatever broke may have
 * broken the rest of the app with it.
 */
const Crash = () => {
  const { t } = useTranslation();
  const error = useRouteError();

  usePageTitle(t('crash.title'));
  // The details are for whoever opens the console, not for the visitor
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto max-w-md space-y-6 px-6 py-16 text-center">
      <NeonHeading color="red" className="text-4xl">
        {t('crash.title')}
      </NeonHeading>
      <p className="text-slate-300">{t('crash.text')}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={() => window.location.reload()}>
          {t('crash.reload')}
        </Button>
        {/* A plain link on purpose: it loads the app from scratch */}
        <a
          href="/"
          className="border-night-control rounded border px-4 py-2 text-sm font-semibold tracking-wider text-slate-300 uppercase hover:border-slate-300"
        >
          {t('crash.backToStart')}
        </a>
      </div>
    </main>
  );
};

const routes: RouteObject[] = [
  {
    element: <Gate />,
    errorElement: <Crash />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'hive', element: <HivePage /> },
      { path: 'hive/:playerId', element: <ComparisonPage /> },
      { path: 'maps/:leaderboardId', element: <MapPage /> },
      { path: 'revenge', element: <RevengePage /> },
      { path: 'trending', element: <TrendingPage /> },
      { path: 'profile', element: <Profile /> },
      { path: '*', element: <NotFound /> },
    ],
  },
];

export { routes };
