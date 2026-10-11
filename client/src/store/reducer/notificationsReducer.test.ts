import reducer, { selectNotifications } from './notificationsReducer';

import type { Notification, Notifications } from './notificationsReducer';

describe('notifications reducer', () => {
  it('should return initialState', () => {
    const initialState: Notifications = [];

    expect(reducer(undefined, { type: 'mockType' })).toStrictEqual(
      initialState
    );
  });
});

describe('selectors', () => {
  const exampleNotification: Notification = {
    notification: 'This is a Notification',
  };

  it('should select notifications', () => {
    const mockStore: Notifications = [exampleNotification];

    const notifications = selectNotifications(mockStore);

    expect(notifications).toStrictEqual([
      { notification: 'This is a Notification' },
    ]);
  });
});
