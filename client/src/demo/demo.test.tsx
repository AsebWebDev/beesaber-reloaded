import { screen, within } from '@testing-library/react';
import axe from 'axe-core';
import { beforeEach, describe, expect, it } from 'vitest';

import { i18n } from '@/i18n/i18n.ts';
import { fakeApi } from '@/testing/fakeApi.ts';
import { renderApp } from '@/testing/renderApp.tsx';

import { BEES, LEADERBOARDS, ME, SCORES, STRANGERS } from './data.ts';
import { createDemoHandlers } from './handlers.ts';

/**
 * The demo is what visitors who are not invited see of the app, so every
 * page has to show something there, and be as accessible as the real app.
 * A new page or list that stays empty with the demo's data fails here.
 */

const t = i18n.t;

/** Turns a text into a pattern that matches it literally */
const literally = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Any of the demo's songs, wherever a page lists maps */
const anySong = new RegExp(
  LEADERBOARDS.map(({ songName }) => literally(songName)).join('|')
);

const queen = BEES[0]!;

/** A player's name, also where the page puts their flag in front of it */
const named = (name: string) => new RegExp(literally(name));

/** A map that both I and the first bee have played */
const sharedMap = LEADERBOARDS.find(
  ({ id }) =>
    SCORES[ME.id]?.some((s) => s.leaderboardId === id) &&
    SCORES[queen.id]?.some((s) => s.leaderboardId === id)
)!;

const PAGES = [
  {
    name: 'the dashboard',
    url: '/',
    ready: () => screen.findAllByText(queen.name),
    empty: [t('dashboard.emptyHive').replace(/<[^>]+>/g, '')],
  },
  {
    name: 'the hive',
    url: '/hive',
    ready: () => screen.findAllByText(named(BEES.at(-1)!.name)),
    empty: [t('hive.empty')],
  },
  {
    name: 'a comparison with a bee',
    url: `/hive/${queen.id}`,
    ready: () => screen.findAllByText(anySong),
    empty: [t('comparison.emptyAll')],
  },
  {
    name: 'a map',
    url: `/maps/${sharedMap.id}`,
    ready: () => screen.findAllByText(queen.name),
    empty: [t('map.empty')],
  },
  {
    name: 'the revenge list',
    url: '/revenge',
    ready: () => screen.findAllByText(anySong),
    empty: [t('revenge.empty')],
  },
  {
    name: 'what the hive is playing',
    url: '/trending',
    ready: () => screen.findAllByText(anySong),
    empty: [],
  },
  {
    name: 'my profile',
    url: '/profile',
    ready: () => screen.findAllByText(anySong),
    empty: [t('scores.empty')],
  },
];

beforeEach(() => {
  // In front of the fake API of the other tests, for this file only
  fakeApi.server.use(...createDemoHandlers().handlers);
});

describe('the demo', () => {
  it.each(PAGES)('fills $name, accessibly', async ({ empty, ready, url }) => {
    renderApp(url);

    await ready();

    for (const text of empty)
      expect(screen.queryByText(text)).not.toBeInTheDocument();

    const { violations } = await axe.run(document, {
      runOnly: [
        'wcag2a',
        'wcag2aa',
        'wcag21a',
        'wcag21aa',
        'wcag22aa',
        'best-practice',
      ],
      // The test browser lays nothing out, so it cannot judge colours
      rules: { 'color-contrast': { enabled: false } },
    });

    expect(
      violations.map(
        ({ help, id, nodes }) =>
          `${id}: ${help} (${nodes.map(({ html }) => html).join(', ')})`
      )
    ).toEqual([]);
  });

  it('has maps the hive played lately that I never did', () => {
    const mine = new Set(SCORES[ME.id]!.map((s) => s.leaderboardId));
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const fresh = BEES.flatMap(({ id }) => SCORES[id]!).filter(
      (s) => !mine.has(s.leaderboardId) && Date.parse(s.playedAt) > twoWeeksAgo
    );

    expect(fresh.length).toBeGreaterThan(0);
  });

  it('lets the visitor add a bee from the search, and remove one', async () => {
    const stranger = STRANGERS[0]!;
    const { user } = renderApp('/hive');

    await user.type(
      await screen.findByLabelText(t('hive.searchLabel')),
      stranger.name
    );
    await user.click(
      await screen.findByRole('button', {
        name: t('hive.addFor', { name: stranger.name }),
      })
    );
    await user.click(
      await screen.findByRole('button', {
        name: t('hive.removeFor', { name: queen.name }),
      })
    );

    expect(
      await screen.findByRole('button', {
        name: t('hive.removeFor', { name: stranger.name }),
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: t('hive.removeFor', { name: queen.name }),
      })
    ).not.toBeInTheDocument();
  });

  it('lets the visitor compare as another player', async () => {
    const other = STRANGERS[1]!;
    const { user } = renderApp('/profile');

    await user.click(
      await screen.findByRole('button', { name: t('profile.change') })
    );
    await user.type(
      screen.getByLabelText(t('pickProfile.searchLabel')),
      other.name
    );
    await user.click(
      (await screen.findAllByRole('button', { name: /^This is me/ }))[0]!
    );

    expect(
      await screen.findByText(t('profile.changed', { name: other.name }))
    ).toBeInTheDocument();
  });

  it('lists only the chosen bee in the revenge list', async () => {
    renderApp(`/revenge?bee=${queen.id}`);

    // The other bees stay in the filter's choices, but not in the list
    const list = await screen.findByRole('table');

    await within(list).findAllByText(anySong);

    for (const bee of BEES.slice(1))
      expect(within(list).queryByText(named(bee.name))).not.toBeInTheDocument();
  });

  it('says so for a map nobody played and a player outside the hive', async () => {
    renderApp('/maps/1');

    expect(await screen.findByText(t('map.unknown.title'))).toBeInTheDocument();

    renderApp(`/hive/${STRANGERS[0]!.id}`);

    expect(
      await screen.findByText(t('comparison.notInHive.title'))
    ).toBeInTheDocument();
  });

  it('starts over when the visitor deletes the account', async () => {
    const { user } = renderApp('/profile');

    await user.click(
      await screen.findByRole('button', { name: t('deleteAccount.open') })
    );
    await user.click(
      screen.getByRole('button', { name: t('deleteAccount.confirm') })
    );

    expect(await screen.findByTestId('landing-page')).toBeInTheDocument();
  });

  it('sends "Sign in with Google" back to the start of the demo', async () => {
    fakeApi.server.use(...createDemoHandlers({ signInUrl: '/demo/' }).handlers);

    const answer = await fetch(
      new URL('/api/auth/sign-in/social', window.location.origin),
      { method: 'POST' }
    );

    expect(await answer.json()).toEqual({ url: '/demo/', redirect: true });
  });

  it('signs the visitor out to the landing page', async () => {
    const { reset, handlers } = createDemoHandlers();

    fakeApi.server.use(...handlers);
    reset();

    const { user } = renderApp('/hive');

    await screen.findAllByText(named(queen.name));
    await user.click(screen.getByRole('button', { name: t('common.signOut') }));

    expect(
      await screen.findByRole('button', { name: t('landing.google') })
    ).toBeInTheDocument();
  });
});
