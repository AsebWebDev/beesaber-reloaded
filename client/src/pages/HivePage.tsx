import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { countryFlag, formatRank, formatScore } from '@/lib/format.ts';
import { usePageTitle } from '@/lib/usePageTitle.ts';

/** Who is in my hive, with adding and removing */
const HivePage = () => {
  const { t } = useTranslation();
  const me = useMe();
  const hive = useHive();
  const add = useAddBee();
  const remove = useRemoveBee();
  const memberIds = new Set(hive.data?.items.map((item) => item.player.id));
  const heading = useRef<HTMLHeadingElement & HTMLParagraphElement>(null);
  // What just happened, for people who do not see the list change. Kept
  // as what happened, not as a text, so it follows a change of language.
  const [notice, setNotice] = useState<{
    name: string;
    what: 'added' | 'removed';
  }>();

  usePageTitle(t('hive.title'));

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <NeonHeading color="yellow" className="text-3xl" focusRef={heading}>
          {t('hive.title')}
        </NeonHeading>
        <p role="status" className="sr-only">
          {notice !== undefined &&
            t(notice.what === 'added' ? 'hive.added' : 'hive.removed', {
              name: notice.name,
            })}
        </p>
        {hive.isPending && <Spinner />}
        {hive.isError && (
          <ErrorNote error={hive.error} onRetry={() => void hive.refetch()} />
        )}
        {remove.isError && <ErrorNote error={remove.error} />}
        {hive.data?.items.length === 0 && (
          <EmptyState>{t('hive.empty')}</EmptyState>
        )}

        <ul className="space-y-2">
          {hive.data?.items.map(({ player, shared }) => (
            <li key={player.id}>
              <Card className="flex items-center gap-3">
                <Avatar src={player.avatarUrl} />
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/hive/${player.id}`}
                    className="block truncate font-semibold text-slate-100 hover:underline"
                  >
                    {countryFlag(player.country)} {player.name}
                  </Link>
                  {isSyncing(player) ? (
                    <p className="text-neon-yellow-core text-xs">
                      {t('hive.fetching')}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400">
                      {[
                        formatRank(player.rank),
                        t('common.mapsPlayed', {
                          count: player.totalPlayed,
                          number: formatScore(player.totalPlayed),
                        }),
                        t('hive.sharedWithYou', {
                          number: formatScore(shared),
                        }),
                      ].join(' · ')}
                    </p>
                  )}
                  {player.syncError !== null && !isSyncing(player) && (
                    <p className="text-neon-red-core text-xs">
                      {player.syncError === 'not_found'
                        ? t('hive.syncGone')
                        : t('hive.syncFailed')}
                    </p>
                  )}
                </div>
                <Button
                  look="danger"
                  disabled={remove.isPending}
                  onClick={() =>
                    remove.mutate(player.id, {
                      onSuccess: () => {
                        setNotice({ what: 'removed', name: player.name });
                        // The button that was pressed is gone with its row
                        heading.current?.focus();
                      },
                    })
                  }
                  aria-label={t('hive.removeFor', { name: player.name })}
                >
                  {t('hive.remove')}
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <NeonHeading as="h2" color="blue" className="text-2xl">
          {t('hive.addHeading')}
        </NeonHeading>
        <Card>
          <PlayerSearch
            label={t('hive.searchLabel')}
            actionLabel={t('hive.add')}
            actionName={(player) => t('hive.addFor', { name: player.name })}
            pendingId={add.isPending ? add.variables : undefined}
            onPick={(player) =>
              add.mutate(player.id, {
                onSuccess: () =>
                  setNotice({ what: 'added', name: player.name }),
              })
            }
            disabledReason={(player) => {
              if (player.id === me.data?.player?.id) return t('hive.isYou');
              if (memberIds.has(player.id)) return t('hive.inHive');

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
