import { useId, useState } from 'react';

import { usePlayerSearch } from '@/api/queries.ts';
import { countryFlag, formatRank } from '@/lib/format.ts';
import { useDebouncedValue } from '@/lib/useDebouncedValue.ts';

import { Avatar, Button, EmptyState, ErrorNote, Spinner } from './ui.tsx';

import type { FoundPlayer } from '@/api/queries.ts';

type Props = {
  /** What the button next to each result says */
  actionLabel: string;
  /** Result ids that cannot be picked, with the reason shown instead */
  disabledReason?: (player: FoundPlayer) => string | undefined;
  label: string;
  onPick: (player: FoundPlayer) => void;
  /** The id of the player whose pick is being processed right now */
  pendingId?: string;
};

/** A search box for ScoreSaber players with a pick button per result */
const PlayerSearch = ({
  actionLabel,
  disabledReason,
  label,
  onPick,
  pendingId,
}: Props) => {
  const inputId = useId();
  const [text, setText] = useState('');
  const name = useDebouncedValue(text.trim());
  const search = usePlayerSearch(name);

  return (
    <div className="space-y-3">
      <label htmlFor={inputId} className="block text-sm text-slate-300">
        {label}
      </label>
      <input
        id={inputId}
        type="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Player name, at least 3 characters"
        autoComplete="off"
        className="border-night-control bg-night focus:border-neon-blue w-full rounded border px-3 py-2 text-slate-100 placeholder:text-slate-400"
      />

      {search.isFetching && <Spinner label="Searching" />}
      {search.isError && <ErrorNote error={search.error} />}
      {search.data?.items.length === 0 && (
        <EmptyState>No player called “{name}” found.</EmptyState>
      )}

      <ul className="space-y-2">
        {search.data?.items.map((player) => {
          const reason = disabledReason?.(player);

          return (
            <li
              key={player.id}
              className="border-night-line flex items-center gap-3 rounded border px-3 py-2"
            >
              <Avatar src={player.avatarUrl} name={player.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-100">
                  {countryFlag(player.country)} {player.name}
                </p>
                <p className="text-xs text-slate-400">
                  {formatRank(player.rank)}
                </p>
              </div>
              {reason === undefined ? (
                <Button
                  disabled={pendingId !== undefined}
                  onClick={() => onPick(player)}
                >
                  {pendingId === player.id ? 'Working…' : actionLabel}
                </Button>
              ) : (
                <span className="text-sm text-slate-400">{reason}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export { PlayerSearch };
