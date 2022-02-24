import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { initialState as store } from '@/store/store';
import exampleUserData from '@/testing/testData/exampleUserData';

import useLoadingState from './useLoadingState';

import type { ReactNode } from 'react';

const extendedStore = { ...store, userData: exampleUserData };

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('sharedHooks/useLoadtingState', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.resetAllMocks();
    jest.useRealTimers();
  });

  it('should return false when not fetching data', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={mockStore(store)}>{children}</Provider>
    );

    const { result } = renderHook(() => useLoadingState(), { wrapper });

    expect(result.current).toBe(false);
  });

  it('should return true when fetching data', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={mockStore(extendedStore)}>{children}</Provider>
    );

    const { result } = renderHook(() => useLoadingState(), { wrapper });

    expect(result.current).toBe(true);
  });
});
