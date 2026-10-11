import { describe, expect, it } from 'vitest';

import {
  selectIsFetchingData,
  selectIsLoggedIn,
  userIsFetchingData,
  userIsLoggedIn,
} from './reducer/appStatusReducer';
import {
  selectMyScoreSaberId,
  selectUserId,
  userDataUpdated,
} from './reducer/userDataReducer';
import { createAppStore } from './store';

describe('store', () => {
  it('starts logged out and without user data', () => {
    const store = createAppStore();

    expect(selectIsLoggedIn(store.getState())).toBe(false);
    expect(selectUserId(store.getState())).toBeUndefined();
  });

  it('tracks the login status', () => {
    const store = createAppStore();

    store.dispatch(userIsLoggedIn(true));

    expect(selectIsLoggedIn(store.getState())).toBe(true);
  });

  it('tracks whether data is being fetched', () => {
    const store = createAppStore();

    store.dispatch(userIsFetchingData({ status: true, statusText: 'Loading' }));

    expect(selectIsFetchingData(store.getState())).toEqual({
      status: true,
      statusText: 'Loading',
    });
  });

  it('merges updates into the user data instead of replacing it', () => {
    const store = createAppStore();

    store.dispatch(
      userDataUpdated({
        _id: 'abc',
        googleImageUrl: '',
        googleName: 'Darth Vader',
        myScoreSaberId: '',
      })
    );
    store.dispatch(
      userDataUpdated({ myScoreSaberId: '123', totalPlayCount: 7 })
    );

    expect(selectUserId(store.getState())).toBe('abc');
    expect(selectMyScoreSaberId(store.getState())).toBe('123');
  });

  it('gives every caller a store of its own', () => {
    const first = createAppStore();
    const second = createAppStore();

    first.dispatch(userIsLoggedIn(true));

    expect(selectIsLoggedIn(second.getState())).toBe(false);
  });
});
