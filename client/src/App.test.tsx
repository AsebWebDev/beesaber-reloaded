import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { fakeApi } from '@/testing/fakeApi.ts';
import { renderApp } from '@/testing/renderApp.tsx';

/**
 * The app from a user's point of view: every test renders the whole thing
 * against the fake API and does what a person would do.
 */

describe('before signing in', () => {
  it('shows the landing page with the ways to sign in the server offers', async () => {
    renderApp();

    expect(await screen.findByTestId('landing-page')).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: 'Dev Login' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Sign in with Google' })
    ).not.toBeInTheDocument();
  });

  it('offers Google when the server has it switched on', async () => {
    fakeApi.set({ signIn: { devLogin: false, google: true } });
    renderApp();

    expect(
      await screen.findByRole('button', { name: 'Sign in with Google' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Dev Login' })
    ).not.toBeInTheDocument();
  });

  it('says that only invited friends can sign in', async () => {
    renderApp();

    expect(
      await screen.findByText(/BeeSaber is a private, non-commercial project/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/open only to friends of the developer/)
    ).toBeInTheDocument();
  });

  it('shows the landing page whatever URL was opened', async () => {
    renderApp('/hive');

    expect(await screen.findByTestId('landing-page')).toBeInTheDocument();
  });
});

describe('the first sign-in', () => {
  it('asks for the ScoreSaber profile and then opens the dashboard', async () => {
    const { user } = renderApp();

    await user.click(await screen.findByRole('button', { name: 'Dev Login' }));

    expect(
      await screen.findByRole('heading', { name: 'Which player are you?' })
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText('Your name on ScoreSaber'), 'myself');
    await user.click(
      await screen.findByRole('button', { name: /^This is me/ })
    );

    expect(
      await screen.findByRole('heading', { name: 'Head to head' })
    ).toBeInTheDocument();
    expect(await screen.findByText(/Your hive is empty/)).toBeInTheDocument();
  });

  it('does not search before three characters are typed', async () => {
    fakeApi.set({ signedIn: true });
    const { user } = renderApp();

    await user.type(
      await screen.findByLabelText('Your name on ScoreSaber'),
      'bu'
    );

    // Longer than the pause the search waits for
    await new Promise((resolve) => setTimeout(resolve, 600));

    expect(
      screen.queryByRole('button', { name: /^This is me/ })
    ).not.toBeInTheDocument();
  });
});

describe('the dashboard', () => {
  it('reports a bee who went past my score', async () => {
    fakeApi.signedInAs({ hive: [fakeApi.BEE.id], news: [fakeApi.news()] });
    renderApp();

    const news = (await screen.findByText('beat your score')).closest('div')!;

    expect(
      within(news).getByRole('link', { name: 'buzz' })
    ).toBeInTheDocument();
    expect(within(news).getByText('Superstar')).toBeInTheDocument();
    expect(within(news).getByText('500,000')).toBeInTheDocument();
    expect(within(news).getByText('400,000')).toBeInTheDocument();
    expect(within(news).getByText('−100,000')).toBeInTheDocument();
  });

  it('shows the head-to-head record of every bee', async () => {
    fakeApi.signedInAs({ hive: [fakeApi.BEE.id] });
    renderApp();

    expect(await screen.findByText('You lead on 1')).toBeInTheDocument();
    expect(screen.getByText('They lead on 1')).toBeInTheDocument();
    expect(screen.getByText('2 shared maps')).toBeInTheDocument();
  });

  it('says so when a sync finds everything up to date', async () => {
    fakeApi.signedInAs();
    const { user } = renderApp();

    await user.click(
      await screen.findByRole('button', { name: 'Sync scores' })
    );

    expect(await screen.findByText(/Already up to date/)).toBeInTheDocument();
  });

  it('shows that scores are being fetched and updates itself when they are in', async () => {
    // The server says twice that the bee is being fetched, then that it is done
    fakeApi.signedInAs({ hive: [fakeApi.BEE.id], pollsUntilSynced: 2 });
    renderApp();

    expect(
      await screen.findByText('Fetching scores from ScoreSaber…')
    ).toBeInTheDocument();
    expect(screen.getByText('Fetching scores…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sync scores' })).toBeDisabled();

    // Without anyone clicking, the page asks again until the scores are in
    expect(
      await screen.findByText('2 shared maps', {}, { timeout: 6000 })
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Fetching scores from ScoreSaber…')
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sync scores' })).toBeEnabled();
  }, 10_000);
});

describe('the hive page', () => {
  it('adds a bee found by search and can remove them again', async () => {
    fakeApi.signedInAs();
    const { user } = renderApp('/hive');

    expect(await screen.findByText(/No bees yet/)).toBeInTheDocument();

    await user.type(
      screen.getByLabelText('Find a player on ScoreSaber'),
      'buzz'
    );
    await user.click(
      (await screen.findAllByRole('button', { name: /^Add / }))[0]!
    );

    const remove = await screen.findByRole('button', {
      name: 'Remove buzz from my hive',
    });

    // In the search results the bee can no longer be added
    expect(await screen.findByText('In your hive')).toBeInTheDocument();

    await user.click(remove);

    expect(await screen.findByText(/No bees yet/)).toBeInTheDocument();
  });

  it('does not offer to add myself', async () => {
    fakeApi.signedInAs();
    const { user } = renderApp('/hive');

    await user.type(
      await screen.findByLabelText('Find a player on ScoreSaber'),
      'myself'
    );

    expect(await screen.findByText('That is you')).toBeInTheDocument();
  });
});

describe('the comparison with a bee', () => {
  it('lists the shared maps with both scores and the difference', async () => {
    fakeApi.signedInAs({ hive: [fakeApi.BEE.id] });
    renderApp(`/hive/${fakeApi.BEE.id}`);

    expect(
      await screen.findByRole('heading', { name: 'Me vs buzz' })
    ).toBeInTheDocument();

    const monster = (await screen.findByText('Monster')).closest('tr')!;

    expect(within(monster).getByText('900,000')).toBeInTheDocument();
    expect(within(monster).getByText('800,000')).toBeInTheDocument();
    expect(within(monster).getByText('+100,000')).toBeInTheDocument();
  });

  it('narrows the list to where I am behind and keeps that in the URL', async () => {
    fakeApi.signedInAs({ hive: [fakeApi.BEE.id] });
    const { router, user } = renderApp(`/hive/${fakeApi.BEE.id}`);

    await screen.findByText('Monster');
    await user.click(screen.getByRole('button', { name: 'Where I am behind' }));

    expect(await screen.findByText('Superstar')).toBeInTheDocument();
    expect(screen.queryByText('Monster')).not.toBeInTheDocument();
    expect(router.state.location.search).toContain('filter=losing');
  });

  it('opens with the filter that is in the URL', async () => {
    fakeApi.signedInAs({ hive: [fakeApi.BEE.id] });
    renderApp(`/hive/${fakeApi.BEE.id}?filter=winning`);

    expect(await screen.findByText('Monster')).toBeInTheDocument();
    expect(screen.queryByText('Superstar')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Where I am ahead' })
    ).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('my profile', () => {
  it('lists my scores and filters them by song', async () => {
    fakeApi.signedInAs();
    const { user } = renderApp('/profile');

    expect(await screen.findByText('Monster')).toBeInTheDocument();
    expect(screen.getByText('Superstar')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Filter songs'), 'super');

    // The list follows once typing has paused and the answer is in
    await waitFor(() => {
      expect(screen.getByText('Superstar')).toBeInTheDocument();
      expect(screen.queryByText('Monster')).not.toBeInTheDocument();
    });
  });

  it('sorts by the highest score on request', async () => {
    fakeApi.signedInAs();
    const { user } = renderApp('/profile');

    await screen.findByText('Monster');
    await user.click(screen.getByRole('button', { name: 'Highest score' }));

    // The header and the two scores, once the placeholders are gone
    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(3));

    const rows = screen.getAllByRole('row');

    // Row 0 is the header. Monster has the higher score.
    expect(within(rows[1]!).getByText('Monster')).toBeInTheDocument();
    expect(within(rows[2]!).getByText('Superstar')).toBeInTheDocument();
  });
});

describe('signing out', () => {
  it('returns to the landing page', async () => {
    fakeApi.signedInAs();
    const { user } = renderApp();

    await user.click(await screen.findByRole('button', { name: 'Sign out' }));

    expect(await screen.findByTestId('landing-page')).toBeInTheDocument();
  });

  it('does not pretend to have signed out when the server refused', async () => {
    fakeApi.signedInAs({ signOutFails: true });
    const { user } = renderApp();

    await user.click(await screen.findByRole('button', { name: 'Sign out' }));

    // The user is told, and stays where they are: still signed in
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'You are still signed in'
    );
    expect(screen.queryByTestId('landing-page')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeEnabled();
  });
});

describe('deleting my account', () => {
  it('asks first, then deletes it and returns to the landing page', async () => {
    fakeApi.signedInAs();
    const { user } = renderApp('/profile');

    await user.click(
      await screen.findByRole('button', { name: 'Delete account' })
    );

    // Nothing has happened yet: the question is on screen
    expect(screen.getByText(/This cannot be undone/)).toBeInTheDocument();
    expect(fakeApi.state().signedIn).toBe(true);

    await user.click(
      screen.getByRole('button', { name: 'Yes, delete my account' })
    );

    expect(await screen.findByTestId('landing-page')).toBeInTheDocument();
    expect(fakeApi.state().devAccount).toBe('missing');
  });

  it('keeps the account when I change my mind', async () => {
    fakeApi.signedInAs();
    const { user } = renderApp('/profile');

    await user.click(
      await screen.findByRole('button', { name: 'Delete account' })
    );
    await user.click(screen.getByRole('button', { name: 'Keep my account' }));

    expect(
      screen.queryByRole('button', { name: 'Yes, delete my account' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Delete account' })
    ).toHaveAttribute('aria-expanded', 'false');
    expect(fakeApi.state().signedIn).toBe(true);
  });

  it('does not pretend to have deleted it when the server refused', async () => {
    fakeApi.signedInAs();
    fakeApi.server.use(
      http.delete('/api/me', () => new HttpResponse(null, { status: 500 }))
    );
    const { user } = renderApp('/profile');

    await user.click(
      await screen.findByRole('button', { name: 'Delete account' })
    );
    await user.click(
      screen.getByRole('button', { name: 'Yes, delete my account' })
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'It still exists'
    );
    expect(screen.queryByTestId('landing-page')).not.toBeInTheDocument();
    expect(fakeApi.state().signedIn).toBe(true);
  });
});

describe('an unknown address', () => {
  it('says so and links back', async () => {
    fakeApi.signedInAs();
    renderApp('/does-not-exist');

    expect(
      await screen.findByText(/There is nothing at this address/)
    ).toBeInTheDocument();
  });
});

describe('while a list is loading', () => {
  it('shows placeholder rows when the sort order of my scores changes', async () => {
    fakeApi.signedInAs();
    const { user } = renderApp('/profile');

    await screen.findByText('Monster');
    // From now on, the list takes a moment to arrive
    fakeApi.set({ listDelayMs: 300 });
    await user.click(screen.getByRole('button', { name: 'Highest score' }));

    // The old rows give way to as many placeholders, and it is announced
    expect(await screen.findAllByTestId('skeleton-row')).toHaveLength(2);
    expect(screen.queryByText('Monster')).not.toBeInTheDocument();
    expect(screen.getByText('Loading scores')).toHaveRole('status');
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');

    // Then the new list replaces them
    expect(await screen.findByText('Monster')).toBeInTheDocument();
    expect(screen.queryByTestId('skeleton-row')).not.toBeInTheDocument();
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'false');
  });

  it('shows placeholder rows when the comparison filter changes', async () => {
    fakeApi.signedInAs({ hive: [fakeApi.BEE.id] });
    const { user } = renderApp(`/hive/${fakeApi.BEE.id}`);

    await screen.findByText('Monster');
    fakeApi.set({ listDelayMs: 300 });
    await user.click(screen.getByRole('button', { name: 'Where I am behind' }));

    expect(await screen.findAllByTestId('skeleton-row')).toHaveLength(2);
    expect(await screen.findByText('Superstar')).toBeInTheDocument();
    expect(screen.queryByTestId('skeleton-row')).not.toBeInTheDocument();
  });

  it('shows placeholder rows instead of an empty page on the first load', async () => {
    fakeApi.signedInAs({ listDelayMs: 300 });
    renderApp('/profile');

    expect(await screen.findAllByTestId('skeleton-row')).toHaveLength(8);
    expect(screen.queryByText('No scores yet.')).not.toBeInTheDocument();
    expect(await screen.findByText('Monster')).toBeInTheDocument();
  });

  it('shows placeholder rows while my scores are fetched from ScoreSaber', async () => {
    // The list itself answers at once, with nothing in it yet. The server
    // says twice that my scores are being fetched, then that it is done.
    fakeApi.signedInAs({ myPollsUntilSynced: 2 });
    renderApp('/profile');

    expect(await screen.findAllByTestId('skeleton-row')).toHaveLength(8);
    expect(screen.getByText('Loading scores')).toHaveRole('status');
    expect(screen.queryByText('No scores yet.')).not.toBeInTheDocument();

    // Without anyone clicking, the scores take the place of the placeholders
    expect(
      await screen.findByText('Monster', {}, { timeout: 6000 })
    ).toBeInTheDocument();
    expect(screen.queryByTestId('skeleton-row')).not.toBeInTheDocument();
  }, 10_000);
});

describe('when the server has trouble', () => {
  it('keeps the app on screen when asking "who am I" fails in the background', async () => {
    fakeApi.signedInAs({ hive: [fakeApi.BEE.id] });
    const { queryClient } = renderApp();

    await screen.findByText('2 shared maps');
    fakeApi.set({ failures: { me: 500 } });
    await queryClient.invalidateQueries({ queryKey: ['me'] });

    expect(queryClient.getQueryState(['me'])?.status).toBe('error');
    expect(screen.getByText('2 shared maps')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sync scores' })).toBeEnabled();
  });

  it('offers to try again when it cannot find out who is signed in', async () => {
    fakeApi.signedInAs({ failures: { me: 500 } });
    const { user } = renderApp();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The server is having trouble'
    );

    fakeApi.set({ failures: {} });
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(
      await screen.findByRole('heading', { name: 'Head to head' })
    ).toBeInTheDocument();
  });

  it('keeps the scores on screen when loading them again fails', async () => {
    fakeApi.signedInAs();
    const { queryClient, user } = renderApp('/profile');

    await screen.findByText('Monster');
    fakeApi.set({ failures: { scores: 500 } });
    await queryClient.invalidateQueries({ queryKey: ['players'] });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The server is having trouble'
    );
    expect(screen.getByText('Monster')).toBeInTheDocument();

    fakeApi.set({ failures: {} });
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    await waitFor(() =>
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    );
    expect(screen.getByText('Monster')).toBeInTheDocument();
  });

  it('says so, without placeholder rows, when a new sort order fails to load', async () => {
    fakeApi.signedInAs();
    const { user } = renderApp('/profile');

    await screen.findByText('Monster');
    fakeApi.set({ failures: { scores: 500 } });
    await user.click(screen.getByRole('button', { name: 'Highest score' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.queryByTestId('skeleton-row')).not.toBeInTheDocument();
    expect(screen.queryByText('No scores yet.')).not.toBeInTheDocument();

    fakeApi.set({ failures: {} });
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Monster')).toBeInTheDocument();
  });
});

describe('when the session ends while the app is open', () => {
  it('returns to the landing page with the next answer that says so', async () => {
    fakeApi.signedInAs({ hive: [fakeApi.BEE.id] });
    const { queryClient, user } = renderApp();

    await screen.findByText('2 shared maps');
    // The session runs out, or is ended from another device
    fakeApi.set({ signedIn: false });
    await user.click(screen.getByRole('link', { name: 'My hive' }));

    expect(await screen.findByTestId('landing-page')).toBeInTheDocument();
    // Nothing of what was loaded for the user is kept
    expect(queryClient.getQueryData(['hive', 'members'])).toBeUndefined();
  });
});

describe('a page number in the address', () => {
  it('goes to the last page when the address asks for one beyond it', async () => {
    fakeApi.signedInAs({ hive: [fakeApi.BEE.id] });
    const { router } = renderApp(`/hive/${fakeApi.BEE.id}?page=99`);

    expect(await screen.findByText('Monster')).toBeInTheDocument();
    expect(router.state.location.search).toContain('page=1');
    expect(
      screen.queryByText(/have not played any of the same maps/)
    ).not.toBeInTheDocument();
  });

  it('reads anything that is not a page number as the first page', async () => {
    fakeApi.signedInAs({ hive: [fakeApi.BEE.id] });
    renderApp(`/hive/${fakeApi.BEE.id}?page=1.5`);

    expect(await screen.findByText('Monster')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('changing who I am', () => {
  it('lets me pick another ScoreSaber profile on my profile page', async () => {
    fakeApi.signedInAs();
    const { user } = renderApp('/profile');

    expect(
      await screen.findByRole('heading', { name: 'myself' })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Change profile' }));
    await user.type(screen.getByLabelText('Your name on ScoreSaber'), 'buzz');
    await user.click(
      (await screen.findAllByRole('button', { name: /^This is me/ }))[0]!
    );

    expect(
      await screen.findByRole('heading', { name: 'buzz' })
    ).toBeInTheDocument();
    // The picker closes once it is done
    expect(
      screen.queryByLabelText('Your name on ScoreSaber')
    ).not.toBeInTheDocument();
  });

  it('can sign out before a profile is picked', async () => {
    fakeApi.set({ signedIn: true });
    const { user } = renderApp();

    await screen.findByRole('heading', { name: 'Which player are you?' });
    expect(screen.getByText(/Signed in as dev@beesaber.local/)).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(await screen.findByTestId('landing-page')).toBeInTheDocument();
  });
});

describe('signing in', () => {
  it('sends the browser off to Google', async () => {
    fakeApi.set({ signIn: { devLogin: false, google: true } });
    const { user } = renderApp();

    await user.click(
      await screen.findByRole('button', { name: 'Sign in with Google' })
    );

    await waitFor(() => expect(fakeApi.state().googleSignIns).toBe(1));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('says so when the sign-in with Google cannot be started', async () => {
    fakeApi.set({
      googleFails: true,
      signIn: { devLogin: false, google: true },
    });
    const { user } = renderApp();

    await user.click(
      await screen.findByRole('button', { name: 'Sign in with Google' })
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Google did not answer'
    );
    expect(screen.getByTestId('landing-page')).toBeInTheDocument();
  });

  it('creates the local test account when it does not exist yet', async () => {
    fakeApi.set({ devAccount: 'missing' });
    const { user } = renderApp();

    await user.click(await screen.findByRole('button', { name: 'Dev Login' }));

    expect(
      await screen.findByRole('heading', { name: 'Which player are you?' })
    ).toBeInTheDocument();
    expect(fakeApi.state().devAccount).toBe('exists');
  });

  it('says so when the server refuses the local test account', async () => {
    fakeApi.set({ devAccount: 'refused' });
    const { user } = renderApp();

    await user.click(await screen.findByRole('button', { name: 'Dev Login' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Email and password sign up is not enabled'
    );
    expect(screen.getByTestId('landing-page')).toBeInTheDocument();
  });

  it('says so when the server offers no way to sign in', async () => {
    fakeApi.set({ signIn: { devLogin: false, google: false } });
    renderApp();

    expect(
      await screen.findByText('No way to sign in is configured on the server.')
    ).toBeInTheDocument();
  });
});

describe('a list longer than one page', () => {
  it('moves between the pages of my scores', async () => {
    // 2 + 18 scores, 15 to a page
    fakeApi.signedInAs({ extraScores: 18 });
    const { user } = renderApp('/profile');

    expect(await screen.findByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('Monster')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('Page 2 of 2')).toBeInTheDocument();
    expect(await screen.findByText('Extra song 18')).toBeInTheDocument();
    expect(screen.queryByText('Monster')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Previous' }));

    expect(await screen.findByText('Monster')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  });

  it('starts on the first page again when the list is filtered', async () => {
    fakeApi.signedInAs({ extraScores: 18 });
    const { user } = renderApp('/profile');

    await screen.findByText('Page 1 of 2');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByText('Page 2 of 2');

    await user.type(screen.getByLabelText('Filter songs'), 'super');

    // One match once typing has paused, so there is nothing to page through
    await waitFor(() =>
      expect(screen.queryByText(/^Page /)).not.toBeInTheDocument()
    );
    expect(screen.getByText('Superstar')).toBeInTheDocument();
    expect(screen.queryByText('Monster')).not.toBeInTheDocument();
  });

  it('has no page buttons when everything fits on one page', async () => {
    fakeApi.signedInAs();
    renderApp('/profile');

    await screen.findByText('Monster');

    expect(
      screen.queryByRole('navigation', { name: 'Pages' })
    ).not.toBeInTheDocument();
  });
});

describe('lists that have nothing or fail', () => {
  it('says so when the news cannot be loaded, and loads them on request', async () => {
    fakeApi.signedInAs({ failures: { news: 500 }, news: [fakeApi.news()] });
    const { user } = renderApp();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The server is having trouble'
    );

    fakeApi.set({ failures: {} });
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('beat your score')).toBeInTheDocument();
  });

  it('says so when the hive cannot be loaded', async () => {
    fakeApi.signedInAs({ failures: { hive: 500 } });
    renderApp('/hive');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The server is having trouble'
    );
    expect(screen.queryByText(/No bees yet/)).not.toBeInTheDocument();
  });

  it('says so when no player matches the search', async () => {
    fakeApi.signedInAs();
    const { user } = renderApp('/hive');

    await user.type(
      await screen.findByLabelText('Find a player on ScoreSaber'),
      'nobody'
    );

    expect(
      // The note on screen; the same words also go to screen readers
      await screen.findByText('No player called “nobody” found.', {
        ignore: '[role="status"]',
      })
    ).toBeInTheDocument();
  });

  it('says so when no song matches the filter', async () => {
    fakeApi.signedInAs();
    const { user } = renderApp('/profile');

    await screen.findByText('Monster');
    await user.type(screen.getByLabelText('Filter songs'), 'zzz');

    expect(
      await screen.findByText('No song matches “zzz”.')
    ).toBeInTheDocument();
  });
});

describe('for people who do not use a mouse or a screen', () => {
  it('names every page in the browser tab', async () => {
    fakeApi.signedInAs({ hive: [fakeApi.BEE.id] });
    const { user } = renderApp();

    await screen.findByRole('heading', { name: 'Head to head' });
    expect(document.title).toBe('Dashboard · BeeSaber');

    await user.click(screen.getByRole('link', { name: 'My hive' }));
    await waitFor(() => expect(document.title).toBe('My hive · BeeSaber'));

    await user.click(await screen.findByRole('link', { name: /buzz/ }));
    await waitFor(() => expect(document.title).toBe('Me vs buzz · BeeSaber'));

    await user.click(screen.getByRole('link', { name: 'My profile' }));
    await waitFor(() => expect(document.title).toBe('My profile · BeeSaber'));
  });

  it('uses the plain name of the app before signing in', async () => {
    document.title = 'left over from another page';
    renderApp();

    await screen.findByTestId('landing-page');

    expect(document.title).toBe('BeeSaber');
  });

  it('moves the focus to the new page when a menu link is used', async () => {
    fakeApi.signedInAs();
    const { user } = renderApp();

    await screen.findByRole('heading', { name: 'Head to head' });
    // Opening the app does not grab the focus
    expect(screen.getByRole('main')).not.toHaveFocus();

    await user.click(screen.getByRole('link', { name: 'My hive' }));

    await waitFor(() => expect(screen.getByRole('main')).toHaveFocus());
  });

  it('leaves the focus on the filter when only the filter changes', async () => {
    fakeApi.signedInAs({ hive: [fakeApi.BEE.id] });
    const { user } = renderApp(`/hive/${fakeApi.BEE.id}`);

    await screen.findByText('Monster');

    const filter = screen.getByRole('button', { name: 'Where I am behind' });

    await user.click(filter);
    await screen.findByText('Superstar');

    expect(filter).toHaveFocus();
  });

  it('offers a way past the menu as the first stop of the Tab key', async () => {
    fakeApi.signedInAs();
    const { user } = renderApp();

    await screen.findByRole('heading', { name: 'Head to head' });
    await user.tab();

    const skip = screen.getByRole('link', { name: 'Skip to content' });

    expect(skip).toHaveFocus();
    expect(skip).toHaveAttribute('href', '#content');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'content');
  });
});

describe('when a page breaks while it is drawn', () => {
  it('shows a page of its own with a way on, not a stack trace', async () => {
    // The server sends news in a shape this code does not know
    fakeApi.server.use(
      http.get('/api/hive/news', () =>
        HttpResponse.json({ items: [{ unexpected: true }] })
      )
    );
    // React and the router report the error to the console, loudly
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});

    fakeApi.signedInAs();
    renderApp();

    expect(
      await screen.findByRole('heading', { name: 'Something went wrong' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Back to the start' })
    ).toHaveAttribute('href', '/');
    expect(document.body).not.toHaveTextContent(/TypeError|at .*\.tsx/);
    expect(document.title).toBe('Something went wrong · BeeSaber');
    expect(logged).toHaveBeenCalled();
  });
});

describe('a list and the settings that belong to it', () => {
  it('forgets search and sort order when I change who I am', async () => {
    fakeApi.signedInAs();
    const { user } = renderApp('/profile');

    await screen.findByText('Monster');
    await user.type(screen.getByLabelText('Filter songs'), 'super');
    await user.click(screen.getByRole('button', { name: 'Highest score' }));

    await user.click(screen.getByRole('button', { name: 'Change profile' }));
    await user.type(screen.getByLabelText('Your name on ScoreSaber'), 'buzz');
    await user.click(
      (await screen.findAllByRole('button', { name: /^This is me/ }))[0]!
    );
    await screen.findByRole('heading', { name: 'buzz' });

    expect(screen.getByLabelText('Filter songs')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Latest' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('asks the server once when a search is typed on a later page', async () => {
    fakeApi.signedInAs({ extraScores: 18 });
    const { user } = renderApp('/profile');

    await screen.findByText('Page 1 of 2');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByText('Page 2 of 2');

    const asked: string[] = [];

    fakeApi.server.events.on('request:start', ({ request }) => {
      const { pathname, search } = new URL(request.url);

      if (pathname.endsWith('/scores')) asked.push(search);
    });

    await user.type(screen.getByLabelText('Filter songs'), 'super');
    await waitFor(() =>
      expect(screen.queryByText(/^Page /)).not.toBeInTheDocument()
    );

    // Not page 1 of the old list first, and then again with the search
    expect(asked).toEqual(['?page=1&limit=15&sort=recent&search=super']);
  });
});

describe('the comparison with someone who is not in my hive', () => {
  it('says so and points to the hive, without asking the server to compare', async () => {
    fakeApi.signedInAs({ hive: [fakeApi.BEE.id] });

    const asked: string[] = [];

    fakeApi.server.events.on('request:start', ({ request }) =>
      asked.push(new URL(request.url).pathname)
    );
    renderApp('/hive/999');

    expect(
      await screen.findByRole('heading', { name: 'Not in your hive' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to my hive' })).toHaveAttribute(
      'href',
      '/hive'
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(document.title).toBe('Not in your hive · BeeSaber');
    expect(
      asked.filter((path) => path.endsWith('/comparison')).length
    ).toBeLessThanOrEqual(1);
  });
});

describe('a picture that cannot be loaded', () => {
  it('is replaced by a plain box of the same size', async () => {
    fakeApi.signedInAs({ hive: [fakeApi.BEE.id] });
    renderApp('/hive');

    await screen.findByRole('button', { name: /Remove buzz/ });

    const avatar = document.querySelector<HTMLImageElement>(
      `img[src="${fakeApi.BEE.avatarUrl}"]`
    )!;

    expect(avatar).toHaveAttribute('referrerpolicy', 'no-referrer');

    fireEvent.error(avatar);

    expect(avatar).not.toBeInTheDocument();
    expect(screen.getByTestId('picture-missing')).toHaveStyle({
      width: '40px',
      height: '40px',
    });
  });
});
