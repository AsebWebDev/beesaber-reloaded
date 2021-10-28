import reducer, { selectUserData } from './userDataReducer';

import type { UserData } from '../../sharedTypes/UserData';

describe('userData reducer', () => {
  it('should return initialState', () => {
    const initialState: UserData = {};

    expect(reducer(undefined, { type: 'mockType' })).toStrictEqual(
      initialState
    );
  });
});

describe('selectors', () => {
  const exampleUserData: UserData = {
    countryRank: 111,
    county: 'Sweden',
    googleId: '123',
    password: 'myPassword',
    profilePic: 'url',
    rank: 42,
    totalPlayCount: 42,
    totalScore: 1312,
    username: 'lovenotwar',
  };

  it('should select notifications', () => {
    const mockStore: UserData = exampleUserData;

    const userData = selectUserData(mockStore);

    expect(userData).toStrictEqual(exampleUserData);
  });
});
