import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import * as getAllScores from '@/api/services/helper/getAllScores';
import { initialState as store } from '@/store/store';

import AddBeeModal from './AddBeeModal';
import * as useQueryForPlayers from './useQueryForPlayers';

import type { ScoreData } from '@/sharedTypes';
import type { PlayerInfo } from '@/sharedTypes/ScoreSaberUserInfo';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('AddBeeModal', () => {
  let spy: jest.SpyInstance<
    {
      foundPlayers: PlayerInfo[] | null;
      showSpinner: boolean;
      thatIsYou: boolean;
      userAlreadyAdded: boolean;
    },
    [{ query: string; searchBy: 'id' | 'name' }]
  >;

  let getAllScoresSpy: jest.SpyInstance<
    Promise<ScoreData>,
    [id: string, threshold?: number | undefined]
  >;

  beforeEach(() => {
    spy = jest.spyOn(useQueryForPlayers, 'default');
    getAllScoresSpy = jest.spyOn(getAllScores, 'default');
    jest.useFakeTimers();
  });

  afterEach(() => {
    spy.mockRestore();
    getAllScoresSpy.mockRestore();
    spy.mockReset();
    getAllScoresSpy.mockReset();
    jest.useRealTimers();
  });

  it('should match snapshot', () => {
    spy.mockReturnValueOnce({
      foundPlayers: null,
      showSpinner: false,
      thatIsYou: false,
      userAlreadyAdded: false,
    });
    const { container } = render(
      <Provider store={mockStore(store)}>
        <AddBeeModal toggleModal={jest.fn()} />
      </Provider>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('should show Spinner, when showSpinner is true', () => {
    spy.mockReturnValueOnce({
      foundPlayers: null,
      showSpinner: true,
      thatIsYou: false,
      userAlreadyAdded: false,
    });

    render(
      <Provider store={mockStore(store)}>
        <AddBeeModal toggleModal={jest.fn()} />
      </Provider>
    );

    const spinner = screen.getByRole('heading', { name: 'Searching...' });
    const buttons = screen.queryByText('Close');

    expect(buttons).not.toBeInTheDocument();
    expect(spinner).toBeInTheDocument();
  });

  // FIXME: when MSW is running for tests, to properly test useGetUserDataQuery hook

  // it('should show Buttons, when showSpinner is false', () => {
  //   spy.mockReturnValueOnce({
  //     foundPlayers: null,
  //     showSpinner: false,
  //     thatIsYou: false,
  //     userAlreadyAdded: false,
  //   });

  //   render(
  //     <Provider store={mockStore(store)}>
  //       <AddBeeModal toggleModal={jest.fn()} />
  //     </Provider>
  //   );

  //   const spinner = screen.queryByText('Searching...');
  //   const buttons = screen.getByRole('button', { name: 'Close' });

  //   expect(buttons).toBeInTheDocument();
  //   expect(spinner).not.toBeInTheDocument();
  // });

  // it('should call toggleModal when close button is clicked', () => {
  //   const mockToggleModal = jest.fn();

  //   spy.mockReturnValue({
  //     foundPlayers: null,
  //     showSpinner: false,
  //     thatIsYou: false,
  //     userAlreadyAdded: false,
  //   });
  //   render(
  //     <Provider store={mockStore(store)}>
  //       <AddBeeModal toggleModal={mockToggleModal} />
  //     </Provider>
  //   );
  //   const closeButton = screen.getByRole('button');
  //   act(() => userEvent.click(closeButton));
  //   expect(mockToggleModal).toBeCalledTimes(1);
  // });

  // it('should show feedback when thatIsYou is true', () => {
  //   spy.mockReturnValue({
  //     foundPlayers: [exampleSSUserInfo.playerInfo],
  //     showSpinner: false,
  //     thatIsYou: true,
  //     userAlreadyAdded: false,
  //   });
  //   getAllScoresSpy.mockResolvedValue(exampleScoreData)
  //   render(
  //     <Provider store={mockStore(store)}>
  //       <AddBeeModal toggleModal={jest.fn()} />
  //     </Provider>
  //   );
  //   const feedback = screen.getByText('That is you')
  //   expect(feedback).toBeInTheDocument();
  // });

  // it('should show "add" button, when valid player is selected', () => {
  //   spy.mockReturnValue({
  //     foundPlayers: [exampleSSUserInfo.playerInfo],
  //     showSpinner: false,
  //     thatIsYou: true,
  //     userAlreadyAdded: false,
  //   });
  //   getAllScoresSpy.mockResolvedValue(exampleScoreData)
  //   render(
  //     <Provider store={mockStore(store)}>
  //       <AddBeeModal toggleModal={jest.fn()} />
  //     </Provider>
  //   );
  //   const addButton = screen.getByRole(`Add ${exampleSSUserInfo.playerInfo.playerName}`);
  //   expect(addButton).toBeInTheDocument();
  // });
  // it('should show players, when multiple players are found', () =>{
  //   spy.mockReturnValue({
  //     foundPlayers: examplePlayerInfos,
  //     showSpinner: false,
  //     thatIsYou: false,
  //     userAlreadyAdded: false,
  //   });

  //   render(
  //     <Provider store={mockStore(store)}>
  //       <AddBeeModal toggleModal={jest.fn()} />
  //     </Provider>
  //   );
  //   const playersList = screen.findByTestId('found-players-list')
  //   expect(playersList).toBeInTheDocument();
  // })

  it.todo('should match snapshot with no found player');
  it.todo('should match snapshot with one found player');
  it.todo('should match snapshot with multiple found players');
  it.todo('should show selected player, when a player is selected');
  it.todo('should not show "add" button, when no player is selected');
  it.todo(
    'should not show "add" button, when selected player is already added'
  );
  it.todo('should not show "add" button, when selected player is you');

  it.todo(
    'should show Button Spinner, when player is selected, but data is still loading'
  );
  it.todo('should show Footer Spinner, when search is in progress');
  it.todo('should call handleSave when save button is clicked');
  it.todo('should call switchTab when tab is clicked');
  it.todo('should reset query when tab is switched');
  it.todo('should reset query after handleSave is done');
  it.todo('should select player, when handleSelect is called');
  it.todo('should build a correct bee object, when player is selected');
});
