import { Link } from 'react-router';

import { useMe } from '@/api/queries.ts';
import { useSignOut } from '@/auth/useSignOut.ts';
import { Button, EmptyState, ErrorNote, Spinner } from '@/components/ui.tsx';
import { AppLayout } from '@/layout/AppLayout.tsx';
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

  if (me.data === undefined) {
    if (!me.isError)
      return (
        <div className="flex min-h-screen items-center justify-center">
          <Spinner />
        </div>
      );

    return (
      <main className="mx-auto max-w-md space-y-4 px-6 py-16">
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

const NotFound = () => (
  <EmptyState>
    There is nothing at this address.{' '}
    <Link to="/" className="text-neon-yellow-core underline">
      Back to the dashboard
    </Link>
  </EmptyState>
);

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
