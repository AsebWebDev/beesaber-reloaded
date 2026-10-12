import { useLinkProfile } from '@/api/queries.ts';
import { PlayerSearch } from '@/components/PlayerSearch.tsx';
import { Card, ErrorNote, NeonHeading } from '@/components/ui.tsx';

/** After the first sign-in: which ScoreSaber profile is yours? */
const OnboardingPage = () => {
  const link = useLinkProfile();

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-6 py-16">
      <NeonHeading color="yellow" className="text-4xl">
        Which player are you?
      </NeonHeading>
      <p className="text-slate-300">
        BeeSaber compares scores from ScoreSaber. Find your profile there, and
        we fetch your scores. You can change this later.
      </p>

      <Card>
        <PlayerSearch
          label="Your name on ScoreSaber"
          actionLabel="This is me"
          pendingId={link.isPending ? link.variables : undefined}
          onPick={(player) => link.mutate(player.id)}
        />
      </Card>

      {link.isError && <ErrorNote error={link.error} />}
    </main>
  );
};

export { OnboardingPage };
