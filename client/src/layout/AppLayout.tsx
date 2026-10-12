import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, NavLink, Outlet } from 'react-router';

import { useSyncHive, useSyncing } from '@/api/queries.ts';
import { signOut } from '@/auth/authClient.ts';
import { HexLogo } from '@/components/HexLogo.tsx';
import { Avatar, Button, ErrorNote } from '@/components/ui.tsx';

import type { Player } from '@/api/queries.ts';

const LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/hive', label: 'My hive' },
  { to: '/profile', label: 'My profile' },
];

/** The frame around every page for a signed-in user: logo, menu, sync */
const AppLayout = ({ player }: { player: Player }) => {
  const queryClient = useQueryClient();
  const sync = useSyncHive();
  const logout = useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      // Tell everything that shows the user that there is none any more ...
      queryClient.setQueryData(['me'], null);
      // ... and forget what was loaded for the one who just left
      queryClient.removeQueries({
        predicate: ({ queryKey }) =>
          queryKey[0] !== 'me' && queryKey[0] !== 'config',
      });
    },
  });
  const syncing = useSyncing();

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6 lg:flex-row lg:gap-10">
      <header className="flex flex-wrap items-center gap-4 lg:w-56 lg:shrink-0 lg:flex-col lg:items-start">
        <Link to="/" className="flex items-center gap-3">
          <HexLogo size={44} />
          <span className="font-neon text-3xl tracking-wide uppercase">
            <span className="glow-red">Bee</span>
            <span className="glow-blue">Saber</span>
          </span>
        </Link>

        <nav aria-label="Main" className="flex gap-1 lg:w-full lg:flex-col">
          {LINKS.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `font-neon rounded px-2 py-1.5 text-base tracking-wide whitespace-nowrap uppercase transition sm:px-3 sm:text-xl ${
                  isActive ? 'glow-yellow' : 'text-slate-300 hover:text-white'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 lg:mt-auto lg:ml-0 lg:w-full lg:flex-col lg:items-start">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Avatar src={player.avatarUrl} name={player.name} size={28} />
            <span className="max-w-32 truncate">{player.name}</span>
          </div>
          <Button
            look="ghost"
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
          >
            Sign out
          </Button>
        </div>
      </header>

      <main className="min-w-0 flex-1 space-y-6">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <p role="status" className="text-sm text-slate-400">
            {syncing
              ? 'Fetching scores from ScoreSaber…'
              : sync.data?.queued === 0 &&
                'Already up to date, checked less than a minute ago.'}
          </p>
          <Button
            disabled={sync.isPending || syncing}
            onClick={() => sync.mutate()}
          >
            Sync scores
          </Button>
        </div>
        {sync.isError && <ErrorNote error={sync.error} />}

        <Outlet />
      </main>
    </div>
  );
};

export { AppLayout };
