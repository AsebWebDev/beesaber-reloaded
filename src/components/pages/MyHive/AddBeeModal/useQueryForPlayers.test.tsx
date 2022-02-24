import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import * as useDebounce from '@/sharedHooks/useDebounce';
import { initialState } from '@/store/store';

import useQueryForPlayers from './useQueryForPlayers';

import type { ReactNode } from 'react';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

const store = mockStore(initialState);

describe('useQueryForPlayers hook', () => {
  let spyUseDebounce: jest.SpyInstance<
    string | undefined,
    [value: string, delay?: number | undefined]
  >;

  beforeEach(() => {
    // spy = jest.spyOn(useQueryForPlayers, 'default');
    spyUseDebounce = jest.spyOn(useDebounce, 'default');
    jest.useFakeTimers();
  });

  afterEach(() => {
    spyUseDebounce.mockRestore();

    spyUseDebounce.mockReset();

    jest.useRealTimers();
  });

  it('should match the initial return value', () => {
    const testQuery = 'nino';

    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(
      () => useQueryForPlayers({ query: testQuery, searchBy: 'name' }),
      { wrapper }
    );

    expect(result.current).toStrictEqual({
      foundPlayers: null,
      showSpinner: true,
      thatIsYou: false,
      userAlreadyAdded: false,
    });
  });

  it.todo('should find correct array of one found players');
  it.todo('should identify, if found player is the user itself');
  it.todo('should identify, if found player is already added to the hive');
  it.todo('should reset found players on backend error');
});
