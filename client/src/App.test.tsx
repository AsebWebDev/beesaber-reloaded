import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import renderWithProviders from '@/testing/renderWithProviders';

import App from './App';

import type { UserEvent } from '@testing-library/user-event';

const login = async (user: UserEvent) => {
  await user.click(await screen.findByText('Dev Login'));
  await screen.findByText('Logout');
};

describe('App', () => {
  it('shows the landing page to visitors', () => {
    renderWithProviders(<App />);

    expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    expect(
      screen.getByText('Please login with your Google-Account:')
    ).toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  it('shows the menu and the dashboard after logging in', async () => {
    const { user } = renderWithProviders(<App />);

    await login(user);

    expect(screen.queryByTestId('landing-page')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /my\s*profile/i })).toBeVisible();
    expect(screen.getByRole('link', { name: /my\s*hive/i })).toBeVisible();
  });

  it('lists the scores of the player on the profile page', async () => {
    const { user } = renderWithProviders(<App />);

    await login(user);
    await user.click(screen.getByRole('link', { name: /my\s*profile/i }));

    expect(
      await screen.findByText('Starset - It has Begun')
    ).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(4); // header + 3 scores
  });

  it('filters the scores on the profile page by the search text', async () => {
    const { user } = renderWithProviders(<App />);

    await login(user);
    await user.click(screen.getByRole('link', { name: /my\s*profile/i }));
    await screen.findByText('Starset - It has Begun');

    await user.type(screen.getByLabelText('Filter Songs...'), 'deal');

    expect(
      await screen.findByText('Stray from the Path - Let us make a deal')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Starset - It has Begun')
    ).not.toBeInTheDocument();
  });

  it('finds a player by name in the add bee dialog', async () => {
    const { user } = renderWithProviders(<App />);

    await login(user);
    await user.click(screen.getByRole('link', { name: /my\s*hive/i }));
    await user.click(await screen.findByText('Add a Bee'));
    await screen.findByText('Add a new Bee');

    await user.type(screen.getByLabelText('Search Username'), 'cerret');

    const players = await screen.findByTestId('found-players-list');

    expect(within(players).getByText('cerret')).toBeInTheDocument();
    expect(await screen.findByText('Add cerret')).toBeInTheDocument();
  });

  it('returns to the landing page after logging out', async () => {
    const { user } = renderWithProviders(<App />);

    await login(user);
    await user.click(screen.getByText('Logout'));

    expect(await screen.findByTestId('landing-page')).toBeInTheDocument();
  });
});
