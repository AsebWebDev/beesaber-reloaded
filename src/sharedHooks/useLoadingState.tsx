import { skipToken } from '@reduxjs/toolkit/dist/query/react';

import { useGetUserDataQuery } from '@/api/services/apiUser/apiUser';
import { useAppSelector } from '@/store/hooks';
import { selectUserId } from '@/store/reducer/userDataReducer';

const useLoadingState = (): boolean => {
  const userId = useAppSelector(selectUserId);
  const { isFetching: isFetchingUserData } = useGetUserDataQuery(
    userId ?? skipToken
  );

  return isFetchingUserData;
};

export default useLoadingState;
