import { useEffect, useId, useRef, useState } from 'react';

import { usePlayerSearch } from '@/api/queries.ts';
import { countryFlag, formatRank } from '@/lib/format.ts';
import { useDebouncedValue } from '@/lib/useDebouncedValue.ts';

import { Avatar, Button, EmptyState, ErrorNote, Spinner } from './ui.tsx';

import type { FoundPlayer } from '@/api/queries.ts';

/** ScoreSaber does not search for less */
const MIN_LENGTH = 3;

type Props = {
  /** What the button next to each result says */
  actionLabel: string;
  /**
   * What the button is called for someone who hears the page instead of
   * seeing it: a list of ten buttons all named "Add" says nothing. Has to
   * contain `actionLabel`, so that speaking the visible word still finds it.
   */
  actionName: (player: FoundPlayer) => string;
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
  actionName,
  disabledReason,
  label,
  onPick,
  pendingId,
}: Props) => {
  const inputId = useId();
  const hintId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const name = useDebouncedValue(text.trim());
  const search = usePlayerSearch(name);
  const found = search.data?.items.length;
  const pending = pendingId !== undefined;
  const wasPending = useRef(pending);

  // Picking a player usually removes the button that was pressed: the row
  // then says "In your hive" instead. The focus would be left on nothing,
  // and the next Tab would start at the top of the page. Put it back into
  // the search box, where the next search starts anyway.
  useEffect(() => {
    if (wasPending.current && !pending) {
      const active = document.activeElement;
      const lost =
        active === null ||
        active === document.body ||
        (active instanceof HTMLButtonElement && active.disabled);

      if (lost) input.current?.focus();
    }

    wasPending.current = pending;
  }, [pending]);

  return (
    <div className="space-y-3">
      <label htmlFor={inputId} className="block text-sm text-slate-300">
        {label}
      </label>
      <input
        ref={input}
        id={inputId}
        type="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Player name"
        autoComplete="off"
        aria-describedby={hintId}
        className="border-night-control bg-night focus:border-neon-blue w-full rounded border px-3 py-2 text-slate-100 placeholder:text-slate-400"
      />
      {/* Not in the placeholder, which is gone as soon as someone types */}
      <p id={hintId} className="text-xs text-slate-400">
        Type at least {MIN_LENGTH} characters.
      </p>

      {/* Always there, so that a change of its text is read out. Results
          that just appear on screen are silent for a screen reader. */}
      <p role="status" className="sr-only">
        {name.length < MIN_LENGTH || search.isFetching || found === undefined
          ? ''
          : found === 0
            ? `No player called “${name}” found.`
            : `${found} ${found === 1 ? 'player' : 'players'} found.`}
      </p>

      {search.isFetching && <Spinner label="Searching" />}
      {search.isError && <ErrorNote error={search.error} />}
      {found === 0 && <EmptyState>No player called “{name}” found.</EmptyState>}

      <ul className="space-y-2">
        {search.data?.items.map((player) => {
          const reason = disabledReason?.(player);

          return (
            <li
              key={player.id}
              className="border-night-line flex items-center gap-3 rounded border px-3 py-2"
            >
              <Avatar src={player.avatarUrl} />
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
                  disabled={pending}
                  onClick={() => onPick(player)}
                  aria-label={actionName(player)}
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
