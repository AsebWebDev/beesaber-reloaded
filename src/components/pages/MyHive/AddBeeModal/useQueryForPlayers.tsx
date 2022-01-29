import { useEffect, useState } from 'react';

import {
  useGetFullPlayerQuery,
  useGetPlayersByNameQuery,
} from '@/api/services/apiPlayer/apiPlayer';
import { useGetUserDataQuery } from '@/api/services/apiUser/apiUser';
import useDebounce from '@/sharedHooks/useDebounce';
import { useAppSelector } from '@/store/hooks';
import { selectUserId } from '@/store/reducer/userDataReducer';

import type { PlayerInfo } from '@/sharedTypes/ScoreSaberUserInfo';

type Props = {
  query: string;
  searchBy: 'id' | 'name';
};

type ReturnType = {
  foundUsers: PlayerInfo[] | null;
  showSpinner: boolean;
  thatIsYou: boolean;
  userAlreadyAdded: boolean;
};

const useQueryForPlayers = ({ query, searchBy }: Props): ReturnType => {
  const userId = useAppSelector(selectUserId);
  const { data: userData } = useGetUserDataQuery(userId);
  const [foundUsers, setFoundUsers] = useState<PlayerInfo[] | null>(null);
  const [thatIsYou, setThatIsYou] = useState(false);
  const [userAlreadyAdded, setUserAlreadyAdded] = useState(false);
  const debouncedSearchQuery = useDebounce(query, 600);

  const {
    data: playersByName,
    isFetching: isFetchingQueryByName,
    error: errorByName,
  } = useGetPlayersByNameQuery(debouncedSearchQuery);
  const {
    data: playerById,
    isFetching: isFetchingQueryById,
    error: errorById,
  } = useGetFullPlayerQuery(debouncedSearchQuery);

  const showSpinner = isFetchingQueryByName || isFetchingQueryById;

  useEffect(() => {
    if (
      foundUsers !== null &&
      foundUsers.length === 1 &&
      userData !== undefined &&
      userData.bees.length > 0
    ) {
      setThatIsYou(foundUsers[0].playerId === userData.myScoreSaberId);
      setUserAlreadyAdded(
        userData.bees.some((item) => item.playerId === foundUsers[0].playerId)
      );
    } else {
      setThatIsYou(false);
      setUserAlreadyAdded(false);
    }
  }, [foundUsers, userData]);

  useEffect(() => {
    const searchHasError =
      (searchBy === 'id' && errorById !== undefined) ||
      (searchBy === 'name' && errorByName !== undefined);

    if (searchHasError) {
      setFoundUsers(null);
    }
  }, [errorById, errorByName]);

  useEffect(() => {
    const players = searchBy === 'id' ? playerById?.playerInfo : playersByName;

    if (players === undefined) return;

    // If result is an array, multiple Users have been found...
    if (Array.isArray(players) && players.length > 1) setFoundUsers(players);
    // If result is an array of 1 element, only one user has been found...
    if (Array.isArray(players) && players.length === 1)
      setFoundUsers([players[0]]);
    // If result is not an array (searching by ID) only one user had been found...
    if (!Array.isArray(players)) setFoundUsers([players]);
  }, [playerById, playersByName]);

  return { foundUsers, showSpinner, thatIsYou, userAlreadyAdded };
};

export default useQueryForPlayers;
