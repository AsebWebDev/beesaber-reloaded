import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import * as apiUser from '@/api/services/apiUser/apiUser';
import * as getAllScores from '@/api/services/helper/getAllScores';
import * as useDebounce from '@/sharedHooks/useDebounce';
import { initialState as store } from '@/store/store';
import exampleSSUserInfo, {
  examplePlayerInfos,
} from '@/testing/testData/exampleSSUserInfo';

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

  let useUpdateUserDataMutationSpy: jest.SpyInstance;

  let spyUseDebounce: jest.SpyInstance<
    string | undefined,
    [value: string, delay?: number | undefined]
  >;

  beforeEach(() => {
    spy = jest.spyOn(useQueryForPlayers, 'default');
    getAllScoresSpy = jest.spyOn(getAllScores, 'default');
    useUpdateUserDataMutationSpy = jest.spyOn(
      apiUser,
      'useUpdateUserDataMutation'
    );
    spyUseDebounce = jest.spyOn(useDebounce, 'default');
    jest.useFakeTimers();
  });

  afterEach(() => {
    spy.mockRestore();
    getAllScoresSpy.mockRestore();
    useUpdateUserDataMutationSpy.mockRestore();
    spyUseDebounce.mockRestore();
    spy.mockReset();
    getAllScoresSpy.mockReset();
    useUpdateUserDataMutationSpy.mockReset();
    spyUseDebounce.mockReset();
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

    const spinner = screen.queryByTestId('loading-spinner');
    const buttons = screen.queryByText('Close');

    expect(buttons).not.toBeInTheDocument();
    expect(spinner).toBeInTheDocument();
  });

  // FIXME: when MSW is running for tests, to properly test useGetUserDataQuery hook

  it('should show Buttons, when showSpinner is false', () => {
    spy.mockReturnValueOnce({
      foundPlayers: null,
      showSpinner: false,
      thatIsYou: false,
      userAlreadyAdded: false,
    });

    render(
      <Provider store={mockStore(store)}>
        <AddBeeModal toggleModal={jest.fn()} />
      </Provider>
    );

    const spinner = screen.queryByTestId('loading-spinner');
    const buttons = screen.getByRole('button', { name: 'Close' });

    expect(buttons).toBeInTheDocument();
    expect(spinner).not.toBeInTheDocument();
  });

  it('should call toggleModal when close button is clicked', () => {
    const mockToggleModal = jest.fn();

    spy.mockReturnValue({
      foundPlayers: null,
      showSpinner: false,
      thatIsYou: false,
      userAlreadyAdded: false,
    });
    render(
      <Provider store={mockStore(store)}>
        <AddBeeModal toggleModal={mockToggleModal} />
      </Provider>
    );
    const closeButton = screen.getByRole('button');

    act(() => userEvent.click(closeButton));
    expect(mockToggleModal).toBeCalledTimes(1);
  });

  it('should show feedback when thatIsYou is true', () => {
    spy.mockReturnValue({
      foundPlayers: [exampleSSUserInfo.playerInfo],
      showSpinner: false,
      thatIsYou: true,
      userAlreadyAdded: false,
    });

    render(
      <Provider store={mockStore(store)}>
        <AddBeeModal toggleModal={jest.fn()} />
      </Provider>
    );
    const feedback = screen.getByText(
      'You found yourself! What a noble goal in life, but not helping you on Beesaber ;)'
    );

    expect(feedback).toBeInTheDocument();
  });

  // FIXME: fix timeout of waitForElementToBeRemoved
  // it('should show "add" button, when valid player is selected', async () => {
  //   spy.mockReturnValue({
  //     foundPlayers: [exampleSSUserInfo.playerInfo],
  //     showSpinner: false,
  //     thatIsYou: false,
  //     userAlreadyAdded: false,
  //   });

  //   render(
  //     <Provider store={mockStore(store)}>
  //       <AddBeeModal toggleModal={jest.fn()} />
  //     </Provider>
  //   );

  //   await screen.findByTestId('loading-spinner');

  //   const addButton = await screen.findByRole('button', {
  //     name: `Add ${exampleSSUserInfo.playerInfo.playerName}`,
  //   });

  //   expect(addButton).toBeInTheDocument();
  // });

  it('should not show "add" button, when selected player is already added', async () => {
    spy.mockReturnValue({
      foundPlayers: [exampleSSUserInfo.playerInfo],
      showSpinner: false,
      thatIsYou: false,
      userAlreadyAdded: true,
    });

    render(
      <Provider store={mockStore(store)}>
        <AddBeeModal toggleModal={jest.fn()} />
      </Provider>
    );

    await screen.findByTestId('loading-spinner');

    const addButton = screen.queryByRole('button', {
      name: `Add ${exampleSSUserInfo.playerInfo.playerName}`,
    });

    expect(addButton).not.toBeInTheDocument();
  });

  it('should not show "add" button, when selected player is you', async () => {
    spy.mockReturnValue({
      foundPlayers: [exampleSSUserInfo.playerInfo],
      showSpinner: false,
      thatIsYou: true,
      userAlreadyAdded: false,
    });

    render(
      <Provider store={mockStore(store)}>
        <AddBeeModal toggleModal={jest.fn()} />
      </Provider>
    );

    await screen.findByTestId('loading-spinner');

    const addButton = screen.queryByRole('button', {
      name: `Add ${exampleSSUserInfo.playerInfo.playerName}`,
    });

    expect(addButton).not.toBeInTheDocument();
  });

  it('should not show "add" button, when no player is selected', () => {
    spy.mockReturnValue({
      foundPlayers: examplePlayerInfos,
      showSpinner: false,
      thatIsYou: false,
      userAlreadyAdded: false,
    });

    render(
      <Provider store={mockStore(store)}>
        <AddBeeModal toggleModal={jest.fn()} />
      </Provider>
    );

    const addButton = screen.queryByRole('button', {
      name: `Add ${exampleSSUserInfo.playerInfo.playerName}`,
    });

    expect(addButton).not.toBeInTheDocument();
  });

  // FIXME: fix timeout of waitForElementToBeRemoved
  // it('should call handleSave when save button is clicked', async () => {
  //   spy.mockReturnValue({
  //     foundPlayers: [exampleSSUserInfo.playerInfo],
  //     showSpinner: false,
  //     thatIsYou: false,
  //     userAlreadyAdded: false,
  //   });

  //   render(
  //     <Provider store={mockStore(store)}>
  //       <AddBeeModal toggleModal={jest.fn()} />
  //     </Provider>
  //   );

  //   await screen.findByTestId('loading-spinner');

  //   const addButton = await screen.findByRole('button', {
  //     name: `Add ${exampleSSUserInfo.playerInfo.playerName}`,
  //   });

  //   userEvent.click(addButton);

  //   expect(useUpdateUserDataMutationSpy).toHaveBeenCalledTimes(3);
  // });

  it('should call switchTab when tab is clicked', () => {
    render(
      <Provider store={mockStore(store)}>
        <AddBeeModal toggleModal={jest.fn()} />
      </Provider>
    );

    const idTab = screen.getByText('Search by Id');
    const usernameTab = screen.getByText('Search by Username');

    expect(idTab).toHaveClass('active');
    expect(usernameTab).not.toHaveClass('active');

    userEvent.click(usernameTab);

    expect(idTab).not.toHaveClass('active');
    expect(usernameTab).toHaveClass('active');
  });

  it('should reset query when tab is switched', () => {
    render(
      <Provider store={mockStore(store)}>
        <AddBeeModal toggleModal={jest.fn()} />
      </Provider>
    );

    const usernameTab = screen.getByText('Search by Username');
    const inputId = screen.getByLabelText('Search ID');
    const inputUsername = screen.getByLabelText('Search Username');

    fireEvent.change(inputId, { target: { value: 42 } });

    expect(inputId).toHaveValue(42);
    userEvent.click(usernameTab);
    expect(inputUsername).toHaveValue('');
  });

  // it('should show players, when multiple players are found', async () => {
  //   const mockedSearchValue = 'nino';

  //   spyUseDebounce.mockReturnValue(mockedSearchValue);

  //   const extendedStore = Object.assign(store, {
  //     userData: exampleUserData,
  //   });

  //   render(
  //     <Provider store={mockStore(extendedStore)}>
  //       <AddBeeModal toggleModal={jest.fn()} />
  //     </Provider>
  //   );

  //   const usernameTab = screen.getByText('Search by Username');
  //   const inputUsername = screen.getByLabelText('Search Username');

  //   userEvent.click(usernameTab);
  //   fireEvent.change(inputUsername, { target: { value: mockedSearchValue } });

  //   expect(inputUsername).toHaveValue(mockedSearchValue);

  //   // const searching = await screen.findByText('Searching...');

  //   const spinner = await screen.findByTestId('loading-spinner');

  //   await waitForElementToBeRemoved(spinner);

  //   const playersList = await screen.findByTestId('found-players-list');

  //   expect(playersList).toBeInTheDocument();
  // });

  it.todo('should show selected player, when a player is selected');
  it.todo(
    'should show Button Spinner, when player is selected, but data is still loading'
  );
  it.todo('should reset query after handleSave is done');
  it.todo('should select player, when handleSelect is called');
  it.todo('should build a correct bee object, when player is selected');
});
