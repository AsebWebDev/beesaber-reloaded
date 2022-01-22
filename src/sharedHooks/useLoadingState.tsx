import { useGetUserDataQuery } from '@/api/services/apiUser/apiUser';
import { useAppSelector } from '@/store/hooks';
import { selectUserId } from '@/store/reducer/userDataReducer';

const useLoadingState = (): boolean => {
  const userId = useAppSelector(selectUserId);
  const { isFetching: isFetchingUserData } = useGetUserDataQuery(userId);

  return isFetchingUserData;
};

export default useLoadingState;
