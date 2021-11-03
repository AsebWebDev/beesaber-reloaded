import { createAction, createSlice } from '@reduxjs/toolkit';

import prefixActionType from '../helper/prefixActionType';

const name = 'notifications';

const notificationsAction = prefixActionType(name);

const addNotification = createAction(notificationsAction('addNotification'));

type Notification = {
  created?: string;
  notification: string;
  typeOfNotification?: 'Created' | 'Deleted' | 'Updated';
};

type Notifications = Notification[];

type NotificationAction = {
  payload: Notification;
};

const initialState: Notifications = [];

const slice = createSlice({
  name,
  initialState,
  reducers: {
    notificationAdded: (state, action: NotificationAction) => [
      ...state,
      {
        notification: action.payload.notification,
        typeOfNotification: action.payload.typeOfNotification,
        created: new Date().toISOString(),
      },
    ],
  },
});

// SELECTORS
const selectNotifications = (state: Notifications): Notifications => state;

// INITIAL STATE EXPORT
export { initialState };

// ACTIONS EXPORT
export const { notificationAdded } = slice.actions;
export { addNotification };

// SELECTORS EXPORT
export { selectNotifications };

// REDUCER EXPORT
export default slice.reducer;

// TYPES EXPORT
export type { Notification, Notifications };
