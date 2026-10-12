import { Link } from 'react-router';

import {
  isSyncing,
  useAddBee,
  useHive,
  useMe,
  useRemoveBee,
} from '@/api/queries.ts';
import { PlayerSearch } from '@/components/PlayerSearch.tsx';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  ErrorNote,
  NeonHeading,
  Spinner,
} from '@/components/ui.tsx';
import { countryFlag, formatRank } from '@/lib/format.ts';

/** Who is in my hive, with adding and removing */
const HivePage = () => {
  const me = useMe();
  const hive = useHive();
  const add = useAddBee();
  const remove = useRemoveBee();
  const memberIds = new Set(hive.data?.items.map((item) => item.player.id));

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <NeonHeading color="yellow" className="text-3xl">
          My hive
        </NeonHeading>
        {hive.isPending && <Spinner />}
        {hive.isError && <ErrorNote error={hive.error} />}
        {remove.isError && <ErrorNote error={remove.error} />}
        {hive.data?.items.length === 0 && (
          <EmptyState>No bees yet. Search for a player below.</EmptyState>
        )}

        <ul className="space-y-2">
          {hive.data?.items.map(({ player, shared }) => (
            <li key={player.id}>
              <Card className="flex items-center gap-3">
                <Avatar src={player.avatarUrl} name={player.name} />
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/hive/${player.id}`}
                    className="block truncate font-semibold text-slate-100 hover:underline"
                  >
                    {countryFlag(player.country)} {player.name}
                  </Link>
                  {isSyncing(player) ? (
                    <p role="status" className="text-neon-yellow-core text-xs">
                      Fetching scores from ScoreSaber…
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400">
                      {formatRank(player.rank)} · {player.totalPlayed} maps
                      played · {shared} shared with you
                    </p>
                  )}
                  {player.syncError !== null && !isSyncing(player) && (
                    <p className="text-neon-red-core text-xs">
                      The last attempt to fetch their scores failed. It will be
                      tried again.
                    </p>
                  )}
                </div>
                <Button
                  look="danger"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(player.id)}
                  aria-label={`Remove ${player.name} from my hive`}
                >
                  Remove
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <NeonHeading as="h2" color="blue" className="text-2xl">
          Add a bee
        </NeonHeading>
        <Card>
          <PlayerSearch
            label="Find a player on ScoreSaber"
            actionLabel="Add"
            pendingId={add.isPending ? add.variables : undefined}
            onPick={(player) => add.mutate(player.id)}
            disabledReason={(player) => {
              if (player.id === me.data?.player?.id) return 'That is you';
              if (memberIds.has(player.id)) return 'In your hive';

              return undefined;
            }}
          />
        </Card>
        {add.isError && <ErrorNote error={add.error} />}
      </section>
    </div>
  );
};

export { HivePage };
