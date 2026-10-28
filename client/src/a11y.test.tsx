import { screen, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import { beforeEach, describe, expect, it } from 'vitest';

import { i18n, LANGUAGES } from '@/i18n/i18n.ts';
import { fakeApi } from '@/testing/fakeApi.ts';
import { renderApp } from '@/testing/renderApp.tsx';

/**
 * Accessibility, in two parts.
 *
 * The first lets axe-core look at every page in every state for the
 * mistakes a machine can find: missing names, wrong roles, broken
 * structure. It cannot judge colours here, because the test browser does
 * not lay anything out; contrast was worked out by hand.
 *
 * The second checks what no machine finds by itself: where the focus is
 * after something was done, and what is said to someone who cannot see it.
 */

const BEE = fakeApi.BEE.id;

type User = ReturnType<typeof renderApp>['user'];

/** A page in a state: how to get there, and when it has arrived */
type State = {
  act?: (user: User) => Promise<unknown>;
  name: string;
  ready: () => Promise<unknown>;
  setup: () => void;
  url: string;
};

/** Turns a text into a pattern that matches it literally */
const literally = (text: string) =>
  new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

/** The words a translation puts between <tag> and </tag> */
const tagged = (text: string, tag: string) =>
  new RegExp(`<${tag}>(.*?)</${tag}>`).exec(text)?.[1] ?? text;

/**
 * The states, found by their texts in whatever language the test runs in.
 * `t` is called when a state is reached, after the language was set.
 */
const t = i18n.t;

const STATES: State[] = [
  {
    name: 'the landing page',
    setup: () => fakeApi.set({ signIn: { devLogin: true, google: true } }),
    url: '/',
    ready: () => screen.findByRole('button', { name: t('landing.devLogin') }),
  },
  {
    name: 'the profile picker with search results',
    setup: () => fakeApi.set({ signedIn: true }),
    url: '/',
    ready: () => screen.findByLabelText(t('pickProfile.searchLabel')),
    act: async (user) => {
      await user.type(
        screen.getByLabelText(t('pickProfile.searchLabel')),
        'buzz'
      );
      await screen.findAllByRole('button', {
        name: literally(t('pickProfile.action')),
      });
    },
  },
  {
    name: 'the dashboard with news and a bee',
    setup: () => fakeApi.signedInAs({ hive: [BEE], news: [fakeApi.news()] }),
    url: '/',
    // The bee's name links from the news, the revenge list, what the hive
    // is playing and the bee's card
    ready: () =>
      waitFor(() =>
        expect(screen.getAllByRole('link', { name: 'buzz' })).toHaveLength(4)
      ),
  },
  {
    name: 'the empty dashboard',
    setup: () => fakeApi.signedInAs(),
    url: '/',
    ready: async () => {
      await screen.findByText(t('dashboard.noNews'));
      await screen.findByRole('link', {
        name: tagged(t('dashboard.emptyHive'), 'hive'),
      });
    },
  },
  {
    name: 'the dashboard when its lists fail',
    setup: () => fakeApi.signedInAs({ failures: { news: 500, hive: 500 } }),
    url: '/',
    ready: () => screen.findAllByRole('alert'),
  },
  {
    name: 'the hive with search results',
    setup: () => fakeApi.signedInAs({ hive: [BEE] }),
    url: '/hive',
    ready: () =>
      screen.findByRole('button', {
        name: t('hive.removeFor', { name: 'buzz' }),
      }),
    act: async (user) => {
      await user.type(screen.getByLabelText(t('hive.searchLabel')), 'buzz');
      await screen.findByText(t('hive.inHive'));
    },
  },
  {
    name: 'the hive while a bee is being fetched',
    setup: () => fakeApi.signedInAs({ hive: [BEE], pollsUntilSynced: 5 }),
    url: '/hive',
    ready: () => screen.findAllByText(t('hive.fetching')),
  },
  {
    name: 'the comparison',
    setup: () => fakeApi.signedInAs({ hive: [BEE] }),
    url: `/hive/${BEE}`,
    ready: () => screen.findByText('Monster'),
  },
  {
    name: 'the comparison while it loads',
    setup: () => fakeApi.signedInAs({ hive: [BEE], listDelayMs: 2000 }),
    url: `/hive/${BEE}`,
    ready: () => screen.findAllByTestId('skeleton-row'),
  },
  {
    name: 'my profile with several pages of scores',
    setup: () => fakeApi.signedInAs({ extraScores: 18 }),
    url: '/profile',
    ready: () =>
      screen.findByText(t('pagination.position', { page: 1, total: 2 })),
  },
  {
    name: 'my profile with the profile picker open',
    setup: () => fakeApi.signedInAs(),
    url: '/profile',
    ready: () => screen.findByText('Monster'),
    act: (user) =>
      user.click(screen.getByRole('button', { name: t('profile.change') })),
  },
  {
    name: 'my profile when the scores fail to load',
    setup: () => fakeApi.signedInAs({ failures: { scores: 500 } }),
    url: '/profile',
    ready: () => screen.findByRole('alert'),
  },
  {
    name: 'an unknown address',
    setup: () => fakeApi.signedInAs(),
    url: '/nope',
    ready: () =>
      screen.findByRole('link', {
        name: tagged(t('notFound.text'), 'home'),
      }),
  },
  {
    name: 'the hive ranking of a map',
    setup: () => fakeApi.signedInAs({ hive: [BEE] }),
    url: '/maps/2',
    ready: () =>
      screen.findByRole('table', {
        name: t('map.tableName', { song: 'Superstar' }),
      }),
  },
  {
    name: 'a map nobody in the hive has played',
    setup: () => fakeApi.signedInAs(),
    url: '/maps/3',
    ready: () => screen.findByText(t('map.empty')),
  },
  {
    name: 'a map BeeSaber does not know',
    setup: () => fakeApi.signedInAs(),
    url: '/maps/999',
    ready: () => screen.findByRole('heading', { name: t('map.unknown.title') }),
  },
  {
    name: 'the revenge list',
    setup: () => fakeApi.signedInAs({ hive: [BEE] }),
    url: '/revenge',
    ready: () => screen.findByRole('table', { name: t('revenge.title') }),
  },
  {
    name: 'an empty revenge list',
    setup: () => fakeApi.signedInAs(),
    url: '/revenge',
    ready: () => screen.findByText(t('revenge.empty')),
  },
  {
    name: 'what the hive is playing',
    setup: () => fakeApi.signedInAs({ hive: [BEE] }),
    url: '/trending',
    ready: () => screen.findByRole('table', { name: t('trending.title') }),
  },
  {
    name: 'an empty list of what the hive is playing',
    setup: () => fakeApi.signedInAs(),
    url: '/trending',
    ready: () => screen.findByText(t('trending.empty', { days: 14 })),
  },
  {
    name: 'the error screen',
    setup: () => fakeApi.signedInAs({ failures: { me: 500 } }),
    url: '/',
    ready: () => screen.findByRole('alert'),
  },
];

// Every state in every language: a translation can break a page too, say
// with a link that lost its text or a heading that went missing
describe.each(LANGUAGES)('what a machine can check, in %s', (language) => {
  beforeEach(async () => {
    await i18n.changeLanguage(language);
  });

  it.each(STATES)(
    'finds nothing wrong with $name',
    async ({ act, ready, setup, url }) => {
      setup();
      const { user } = renderApp(url);

      await ready();
      await act?.(user);

      const { violations } = await axe.run(document, {
        runOnly: [
          'wcag2a',
          'wcag2aa',
          'wcag21a',
          'wcag21aa',
          'wcag22aa',
          'best-practice',
        ],
        rules: { 'color-contrast': { enabled: false } },
      });

      // Readable when it fails: which rule, and on which element
      expect(
        violations.map(
          ({ help, id, nodes }) =>
            `${id}: ${help} (${nodes.map(({ html }) => html).join(', ')})`
        )
      ).toEqual([]);
    }
  );
});

/** The hidden line that tells a screen reader what just happened */
const said = (text: RegExp | string) =>
  screen
    .getAllByRole('status')
    .some((status) =>
      typeof text === 'string'
        ? status.textContent === text
        : text.test(status.textContent)
    );

describe('where the focus goes when what had it disappears', () => {
  it('moves to the list heading after a bee was removed, and says so', async () => {
    fakeApi.signedInAs({ hive: [BEE] });
    const { user } = renderApp('/hive');

    await user.click(
      await screen.findByRole('button', { name: /Remove buzz/ })
    );
    await screen.findByText(/No bees yet/);

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'My hive' })).toHaveFocus()
    );
    expect(said('buzz was removed from your hive.')).toBe(true);
  });

  it('returns to the search box after a bee was added, and says so', async () => {
    fakeApi.signedInAs();
    const { user } = renderApp('/hive');
    const search = await screen.findByLabelText('Find a player on ScoreSaber');

    await user.type(search, 'buzz');
    await user.click(
      (await screen.findAllByRole('button', { name: /^Add / }))[0]!
    );
    await screen.findByText('In your hive');

    await waitFor(() => expect(search).toHaveFocus());
    expect(said('buzz was added to your hive.')).toBe(true);
  });

  it('returns to the button that opened the profile picker', async () => {
    fakeApi.signedInAs();
    const { user } = renderApp('/profile');

    await user.click(
      await screen.findByRole('button', { name: 'Change profile' })
    );
    await user.type(screen.getByLabelText('Your name on ScoreSaber'), 'buzz');
    await user.click(
      (await screen.findAllByRole('button', { name: /^This is me/ }))[0]!
    );
    await screen.findByRole('heading', { name: 'buzz' });

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Change profile' })
      ).toHaveFocus()
    );
    expect(said('You now compare as buzz.')).toBe(true);
  });

  it('moves to the new screen after a profile was picked and after signing out', async () => {
    fakeApi.set({ signedIn: true });
    const { user } = renderApp();

    await user.type(
      await screen.findByLabelText('Your name on ScoreSaber'),
      'myself'
    );
    await user.click(
      await screen.findByRole('button', { name: /^This is me/ })
    );
    await screen.findByRole('heading', { name: 'Head to head' });

    await waitFor(() => expect(screen.getByRole('main')).toHaveFocus());

    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    await waitFor(() =>
      expect(screen.getByTestId('landing-page')).toHaveFocus()
    );
  });

  it('leaves the focus alone when the app opens', async () => {
    renderApp();

    await screen.findByTestId('landing-page');

    expect(document.body).toHaveFocus();
  });
});

describe('what is said to someone who cannot see the page change', () => {
  it('says how many players a search found, or that it found none', async () => {
    fakeApi.signedInAs();
    const { user } = renderApp('/hive');
    const search = await screen.findByLabelText('Find a player on ScoreSaber');

    await user.type(search, 'buzz');
    await waitFor(() => expect(said('2 players found.')).toBe(true));

    await user.clear(search);
    await user.type(search, 'nobody');
    await waitFor(() =>
      expect(said('No player called “nobody” found.')).toBe(true)
    );
  });

  it('explains the search box beyond its placeholder', async () => {
    fakeApi.signedInAs();
    renderApp('/hive');

    expect(
      await screen.findByLabelText('Find a player on ScoreSaber')
    ).toHaveAccessibleDescription('Type at least 3 characters.');
  });

  it('says what a list holds once it has loaded, and which page it is on', async () => {
    fakeApi.signedInAs({ extraScores: 18 });
    const { user } = renderApp('/profile');

    await screen.findByText('Page 1 of 2');
    expect(said('20 scores in this list, page 1 of 2.')).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() =>
      expect(said('20 scores in this list, page 2 of 2.')).toBe(true)
    );
  });

  it('moves the focus to the other page button when the pressed one is switched off', async () => {
    fakeApi.signedInAs({ extraScores: 18 });
    const { user } = renderApp('/profile');

    await screen.findByText('Page 1 of 2');
    // With the keyboard, as the people this is for would
    screen.getByRole('button', { name: 'Next' }).focus();
    await user.keyboard('{Enter}');
    await screen.findByText('Page 2 of 2');

    // "Next" is off on the last page. Left there, the focus would fall
    // back to the top of the page.
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Previous' })).toHaveFocus()
    );

    await user.keyboard('{Enter}');
    await screen.findByText('Page 1 of 2');

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus()
    );
  });

  it('says when a sync has finished', async () => {
    fakeApi.signedInAs({ hive: [BEE], pollsUntilSynced: 1 });
    renderApp();

    await screen.findByText('Fetching scores from ScoreSaber…');

    expect(
      await screen.findByText('Scores are up to date.', {}, { timeout: 4000 })
    ).toHaveRole('status');
  });
});

describe('what things are called', () => {
  it('names each button in the search results after its player', async () => {
    fakeApi.signedInAs();
    const { user } = renderApp('/hive');

    await user.type(
      await screen.findByLabelText('Find a player on ScoreSaber'),
      'buzz'
    );

    expect(
      await screen.findByRole('button', { name: 'Add buzz to my hive' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Add buzzkill to my hive' })
    ).toBeInTheDocument();
  });

  it('calls the link of a bee on the dashboard by her name and nothing else', async () => {
    fakeApi.signedInAs({ hive: [BEE] });
    renderApp();

    await screen.findByText('2 shared maps');

    // Her card and the revenge list name her, each with a link of her name
    const links = await screen.findAllByRole('link', { name: 'buzz' });

    expect(links.length).toBeGreaterThan(0);
    for (const link of links)
      expect(link).toHaveAttribute('href', `/hive/${BEE}`);
  });

  it('does not describe pictures that stand next to a name', async () => {
    fakeApi.signedInAs({ hive: [BEE], news: [fakeApi.news()] });
    renderApp();

    await screen.findByText('beat your score');

    expect(screen.queryAllByRole('img')).toEqual([]);
  });

  it('names the score tables and lets the keyboard reach their scrolling area', async () => {
    fakeApi.signedInAs({ hive: [BEE] });
    renderApp(`/hive/${BEE}`);

    await screen.findByText('Monster');

    expect(
      screen.getByRole('table', { name: 'Scores: me vs buzz' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Scores: me vs buzz' })
    ).toHaveAttribute('tabindex', '0');
  });

  it('gives every page one main heading', async () => {
    fakeApi.signedInAs({ hive: [BEE] });
    renderApp();

    await screen.findByText('2 shared maps');

    expect(
      screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)
    ).toEqual(['Dashboard']);
    expect(
      screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    ).toEqual(['Head to head', 'News', 'Revenge', 'What the hive is playing']);
  });

  it('marks the page that is open in the menu', async () => {
    fakeApi.signedInAs();
    renderApp('/hive');

    expect(
      await screen.findByRole('link', { name: 'My hive' })
    ).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute(
      'aria-current'
    );
  });

  it('gives times a form machines can read', async () => {
    fakeApi.signedInAs({ hive: [BEE], news: [fakeApi.news()] });
    renderApp();

    await screen.findByText('beat your score');

    expect(document.querySelector('time')).toHaveAttribute(
      'datetime',
      '2024-02-01T10:00:00.000Z'
    );
  });
});

describe('a notice and a change of language', () => {
  it('says what happened in the language switched to afterwards', async () => {
    fakeApi.signedInAs();
    const { user } = renderApp('/profile');

    await user.click(
      await screen.findByRole('button', { name: 'Change profile' })
    );
    await user.type(screen.getByLabelText('Your name on ScoreSaber'), 'buzz');
    await user.click(
      (await screen.findAllByRole('button', { name: /^This is me/ }))[0]!
    );
    await screen.findByRole('heading', { name: 'buzz' });
    expect(said('You now compare as buzz.')).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Deutsch' }));

    await waitFor(() =>
      expect(said('Du vergleichst jetzt als buzz.')).toBe(true)
    );
  });
});
