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

  it('says how many new scores a sync found', async () => {
    fakeApi.signedInAs();
    const { user } = renderApp();

    await user.click(
      await screen.findByRole('button', { name: 'Sync scores' })
    );

    expect(await screen.findByText('1 new score.')).toBeInTheDocument();
  });
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

    // The list follows once typing has paused
    await waitFor(() =>
      expect(screen.queryByText('Monster')).not.toBeInTheDocument()
    );
    expect(screen.getByText('Superstar')).toBeInTheDocument();
  });

  it('sorts by the highest score on request', async () => {
    fakeApi.signedInAs();
    const { user } = renderApp('/profile');

    await screen.findByText('Monster');
    await user.click(screen.getByRole('button', { name: 'Highest score' }));

    const rows = await screen.findAllByRole('row');

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
