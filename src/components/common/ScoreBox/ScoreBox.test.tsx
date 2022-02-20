import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';

import { initialState as store } from '@/store/store';
import exampleBee from '@/testing/testData/exampleBee';
import { exampleScoreData } from '@/testing/testData/exampleScores';

import ScoreBox from './ScoreBox';

import type { Score } from '@/sharedTypes';

const mockStore = configureMockStore();

describe('components/common/ScoreBox', () => {
  it('should show NoScores component when no scores to display present', async () => {
    const scoreData = {
      scoredSongsHashes: [] as string[],
      scoresRecent: [exampleScoreData.scoresRecent[0]],
      scoresTop: [] as Score[],
    };

    render(
      <Provider store={mockStore(store)}>
        <ScoreBox bee={exampleBee} scoreData={scoreData} />
      </Provider>
    );

    const toggle = screen.getByRole('checkbox');

    act(() => userEvent.click(toggle));

    const NoScoresComponent = await screen.findByText('No Scores found 😢');

    expect(NoScoresComponent).toBeInTheDocument();
  });

  it('should toggle tab, when selected', async () => {
    render(
      <Provider store={mockStore(store)}>
        <ScoreBox bee={exampleBee} scoreData={exampleScoreData} />
      </Provider>
    );

    const recentTab = await screen.findByRole('tab', { name: 'Recent' });
    const topTab = await screen.findByRole('tab', { name: 'Top' });

    expect(recentTab).toHaveClass('active');
    expect(topTab).not.toHaveClass('active');

    act(() => userEvent.click(topTab));

    expect(recentTab).not.toHaveClass('active');
    expect(topTab).toHaveClass('active');
  });
});
