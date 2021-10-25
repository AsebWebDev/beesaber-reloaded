import { createAction, createSlice } from '@reduxjs/toolkit';

import prefixActionType from '../helper/prefixActionType';

const name = 'notifications';

const notificationsAction = prefixActionType(name);

const addNotification = createAction(
  notificationsAction('addNotification')
);

type Notification = {
  notification: string;
  typeOfNotification?: 'Created' | 'Deleted' | 'Updated' ;
  created?: string;
}


type State = Notification[];

const initialState: State = []

const slice = createSlice({
  name,
  initialState,
  reducers: {
    notificationAdded: (state, action) => {
      return [
        ...state, {
          notification: action.payload.notification,
          typeOfNotification: action.payload.typeOfNotification,
          created: new Date().toISOString()
        }
      ]
    },
  },
});

console.log(slice.actions.notificationAdded('test'))

// SELECTORS
const selectNotifications = (state: State): Notification[] => state ;

// ACTIONS EXPORT
export const { notificationAdded } =
  slice.actions;
export { addNotification };

// SELECTORS EXPORT
export {
  selectNotifications
};

// REDUCER EXPORT
export default slice.reducer;

// TYPES EXPORT
export type { State };
