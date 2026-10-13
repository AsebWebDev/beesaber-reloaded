import { useEffect, useState } from 'react';

import { useSyncHive, useSyncing } from '@/api/queries.ts';

/**
 * How long "up to date" stays on screen. Long enough to be read at leisure
 * or reached with a screen reader, short enough not to be untrue.
 */
const RESULT_SHOWN_MS = 20_000;

/**
 * Everything behind the "Sync scores" button: starting a sync, knowing
 * whether one is running, and the one line of text that says where it
 * stands.
 */
const useSyncControl = () => {
  const sync = useSyncHive();
  const syncing = useSyncing();
  const { data: result, reset: forgetResult } = sync;
  const [wasSyncing, setWasSyncing] = useState(syncing);
  const [justFinished, setJustFinished] = useState(false);

  // A sync that ends is worth a word: the "fetching" line just vanishing
  // is no news to someone who cannot see it vanish.
  if (wasSyncing !== syncing) {
    setWasSyncing(syncing);
    setJustFinished(!syncing);
  }

  useEffect(() => {
    if (!justFinished) return;

    const timer = setTimeout(() => setJustFinished(false), RESULT_SHOWN_MS);

    return () => clearTimeout(timer);
  }, [justFinished]);

  // "Checked less than a minute ago" is only true for a moment. Left on
  // screen, it would still claim so an hour later.
  useEffect(() => {
    if (result === undefined) return;

    const timer = setTimeout(forgetResult, RESULT_SHOWN_MS);

    return () => clearTimeout(timer);
  }, [result, forgetResult]);

  const message = syncing
    ? 'Fetching scores from ScoreSaber…'
    : justFinished
      ? 'Scores are up to date.'
      : result?.queued === 0
        ? 'Already up to date, checked less than a minute ago.'
        : '';

  return {
    /** True while a sync is being asked for or is running */
    busy: sync.isPending || syncing,
    error: sync.isError ? sync.error : undefined,
    message,
    start: () => sync.mutate(),
  };
};

export { useSyncControl };
