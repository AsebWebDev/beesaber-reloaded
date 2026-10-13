import { useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';

import { useSignOut } from '@/auth/useSignOut.ts';
import { HexLogo } from '@/components/HexLogo.tsx';
import { Avatar, Button, ErrorNote } from '@/components/ui.tsx';
import { useFocusOnMount } from '@/lib/useFocusOnMount.ts';

import { useSyncControl } from './useSyncControl.ts';

import type { Player } from '@/api/queries.ts';

const LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/hive', label: 'My hive' },
  { to: '/profile', label: 'My profile' },
];

/** The frame around every page for a signed-in user: logo, menu, sync */
const AppLayout = ({
  player,
  takeFocus = false,
}: {
  player: Player;
  /** True when this replaces another screen, see the gate in routes.tsx */
  takeFocus?: boolean;
}) => {
  const sync = useSyncControl();
  const logout = useSignOut();
  const { pathname } = useLocation();
  const main = useRef<HTMLElement>(null);
  const shownPath = useRef(pathname);

  useFocusOnMount(main, takeFocus);

  // A link in this app swaps the page without loading a new document, so
  // the browser does nothing a screen reader or a keyboard user would
  // notice: the focus stays on the link that was clicked. Moving it to the
  // new content makes the reader announce it, and the next Tab continues
  // from there. Not on the first page, and not when only the filter or the
  // page number in the address changes.
  useEffect(() => {
    if (shownPath.current === pathname) return;

    shownPath.current = pathname;
    main.current?.focus();
  }, [pathname]);

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6 lg:flex-row lg:gap-10">
      {/* Invisible until reached with Tab: lets keyboard users jump over the
          menu, which otherwise comes first on every page */}
      <a
        href="#content"
        className="bg-night text-neon-yellow-core sr-only rounded px-3 py-2 focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-10"
      >
        Skip to content
      </a>

      <header className="flex flex-wrap items-center gap-x-4 gap-y-3 lg:w-56 lg:shrink-0 lg:flex-col lg:items-start lg:gap-4">
        <Link to="/" className="flex items-center gap-2 sm:gap-3">
          <HexLogo size={40} />
          <span className="font-neon text-2xl tracking-wide uppercase sm:text-3xl">
            <span className="glow-red">Bee</span>
            <span className="glow-blue">Saber</span>
          </span>
        </Link>

        {/* On a phone the menu is a row of its own below the logo, spread over
            the full width, so all three entries fit */}
        <nav
          aria-label="Main"
          className="order-last flex w-full flex-wrap justify-between gap-1 lg:order-none lg:flex-col lg:justify-start"
        >
          {LINKS.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `font-neon rounded px-1 py-1.5 text-[clamp(0.8rem,4.2vw,1.125rem)] tracking-wide whitespace-nowrap uppercase transition sm:px-3 sm:text-xl ${
                  // Underlined as well: the glow alone is a difference of colour
                  isActive
                    ? 'glow-yellow underline decoration-2 underline-offset-8'
                    : 'text-slate-300 hover:text-white'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 lg:mt-auto lg:ml-0 lg:w-full lg:flex-col lg:items-start">
          {/* On the narrowest phones the picture would push "Sign out" into
              a line of its own */}
          <div className="flex items-center gap-2 text-sm text-slate-300 max-[379px]:hidden">
            <Avatar src={player.avatarUrl} size={28} />
            {/* Next to the logo there is no room for the name on a phone */}
            <span className="hidden max-w-32 truncate sm:inline">
              {player.name}
            </span>
          </div>
          <Button
            look="ghost"
            // Smaller on a phone, where it shares a row with the logo
            className="max-sm:px-3 max-sm:py-1.5 max-sm:text-xs"
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
          >
            Sign out
          </Button>
        </div>
      </header>

      <main
        id="content"
        ref={main}
        // Can take the focus from a script, but is no stop for the Tab key
        tabIndex={-1}
        className="min-w-0 flex-1 space-y-6 outline-none"
      >
        <div className="flex flex-wrap items-center justify-end gap-3 max-sm:-mt-2">
          <p role="status" className="text-sm text-slate-400">
            {sync.message}
          </p>
          <Button
            disabled={sync.busy}
            onClick={sync.start}
            className="max-sm:px-3 max-sm:py-1.5 max-sm:text-xs"
          >
            Sync scores
          </Button>
        </div>
        {sync.error !== undefined && <ErrorNote error={sync.error} />}
        {logout.isError && <ErrorNote error={logout.error} />}

        <Outlet />
      </main>
    </div>
  );
};

export { AppLayout };
