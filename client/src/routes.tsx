import { useEffect, useRef } from 'react';
import { Link } from 'react-router';

import { useMe } from '@/api/queries.ts';
import { useSignOut } from '@/auth/useSignOut.ts';
import { Button, EmptyState, ErrorNote, Spinner } from '@/components/ui.tsx';
import { AppLayout } from '@/layout/AppLayout.tsx';
import { usePageTitle } from '@/lib/usePageTitle.ts';
import { ComparisonPage } from '@/pages/ComparisonPage.tsx';
import { DashboardPage } from '@/pages/DashboardPage.tsx';
import { HivePage } from '@/pages/HivePage.tsx';
import { LandingPage } from '@/pages/LandingPage.tsx';
import { OnboardingPage } from '@/pages/OnboardingPage.tsx';
import { ProfilePage } from '@/pages/ProfilePage.tsx';

import type { RouteObject } from 'react-router';
import type { Player } from '@/api/queries.ts';

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
  const logout = useSignOut();
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
  const shown = useRef(screen);

  // Signing in, picking a profile and signing out each replace everything
  // on screen, including whatever had the focus. Without help the focus is
  // then on nothing: a screen reader stays silent, and the Tab key starts
  // over. So the new screen gets it. The first screen of a visit does not;
  // there the browser starts at the top, as on any page.
  useEffect(() => {
    const before = shown.current;

    shown.current = screen;

    if (before !== screen && before !== 'loading')
      document.querySelector<HTMLElement>('main')?.focus();
  }, [screen]);

  if (me.data === undefined) {
    if (!me.isError)
      return (
        <div className="flex min-h-screen items-center justify-center">
          <Spinner />
        </div>
      );

    return (
      <main
        tabIndex={-1}
        className="mx-auto max-w-md space-y-4 px-6 py-16 outline-none"
      >
        <ErrorNote error={me.error} onRetry={() => void me.refetch()} />
        {logout.isError && <ErrorNote error={logout.error} />}
        <Button
          look="ghost"
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
        >
          Sign out
        </Button>
      </main>
    );
  }

  if (me.data === null) return <LandingPage />;
  if (me.data.player === null) return <OnboardingPage />;

  return <AppLayout player={me.data.player} />;
};

/** The profile page needs the player. Inside the gate there always is one. */
const Profile = () => {
  const player: Player | null | undefined = useMe().data?.player;

  return player == null ? null : <ProfilePage player={player} />;
};

const NotFound = () => {
  usePageTitle('Page not found');

  return (
    <EmptyState>
      There is nothing at this address.{' '}
      <Link to="/" className="text-neon-yellow-core underline">
        Back to the dashboard
      </Link>
    </EmptyState>
  );
};

const routes: RouteObject[] = [
  {
    element: <Gate />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'hive', element: <HivePage /> },
      { path: 'hive/:playerId', element: <ComparisonPage /> },
      { path: 'profile', element: <Profile /> },
      { path: '*', element: <NotFound /> },
    ],
  },
];

export { routes };
