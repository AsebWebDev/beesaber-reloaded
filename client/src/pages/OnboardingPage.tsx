import { useLinkProfile, useMe } from '@/api/queries.ts';
import { useSignOut } from '@/auth/useSignOut.ts';
import { PlayerSearch } from '@/components/PlayerSearch.tsx';
import { Button, Card, ErrorNote, NeonHeading } from '@/components/ui.tsx';
import { usePageTitle } from '@/lib/usePageTitle.ts';

/** After the first sign-in: which ScoreSaber profile is yours? */
const OnboardingPage = () => {
  const link = useLinkProfile();
  const me = useMe();
  const logout = useSignOut();

  usePageTitle('Pick your profile');

  return (
    <main
      tabIndex={-1}
      className="mx-auto max-w-2xl space-y-6 px-6 py-16 outline-none"
    >
      <NeonHeading color="yellow" className="text-4xl">
        Which player are you?
      </NeonHeading>
      <p className="text-slate-300">
        BeeSaber compares scores from ScoreSaber. Find your profile there, and
        we fetch your scores. You can change this later on your profile page.
      </p>

      <Card>
        <PlayerSearch
          label="Your name on ScoreSaber"
          actionLabel="This is me"
          actionName={(player) => `This is me: ${player.name}`}
          pendingId={link.isPending ? link.variables : undefined}
          onPick={(player) => link.mutate(player.id)}
        />
      </Card>

      {link.isError && <ErrorNote error={link.error} />}

      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
        {me.data != null && <span>Signed in as {me.data.user.email}.</span>}
        <Button
          look="ghost"
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
        >
          Sign out
        </Button>
      </div>
      {logout.isError && <ErrorNote error={logout.error} />}
    </main>
  );
};

export { OnboardingPage };
