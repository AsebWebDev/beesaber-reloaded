import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

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
    await user.click(await screen.findByRole('button', { name: 'This is me' }));

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
      screen.queryByRole('button', { name: 'This is me' })
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
    // The hive reports its bee as being fetched for the first two requests
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
      (await screen.findAllByRole('button', { name: 'Add' }))[0]!
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
});
