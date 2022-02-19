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
  foundPlayers: PlayerInfo[] | null;
  showSpinner: boolean;
  thatIsYou: boolean;
  userAlreadyAdded: boolean;
};

const useQueryForPlayers = ({ query, searchBy }: Props): ReturnType => {
  const userId = useAppSelector(selectUserId);
  const { data: userData } = useGetUserDataQuery(userId);
  const [foundPlayers, setfoundPlayers] = useState<PlayerInfo[] | null>(null);
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
      foundPlayers !== null &&
      foundPlayers.length === 1 &&
      userData !== undefined &&
      userData.bees.length > 0
    ) {
      setThatIsYou(foundPlayers[0].playerId === userData.myScoreSaberId);
      setUserAlreadyAdded(
        userData.bees.some((item) => item.playerId === foundPlayers[0].playerId)
      );
    } else {
      setThatIsYou(false);
      setUserAlreadyAdded(false);
    }
  }, [foundPlayers, userData]);

  useEffect(() => {
    const searchHasError =
      (searchBy === 'id' && errorById !== undefined) ||
      (searchBy === 'name' && errorByName !== undefined);

    if (searchHasError) {
      setfoundPlayers(null);
    }
  }, [errorById, errorByName]);

  useEffect(() => {
    const players = searchBy === 'id' ? playerById?.playerInfo : playersByName;

    if (players === undefined) return;

    // If result is an array, multiple Users have been found...
    if (Array.isArray(players) && players.length > 1) setfoundPlayers(players);
    // If result is an array of 1 element, only one user has been found...
    if (Array.isArray(players) && players.length === 1)
      setfoundPlayers([players[0]]);
    // If result is not an array (searching by ID) only one user had been found...
    if (!Array.isArray(players)) setfoundPlayers([players]);
  }, [playerById, playersByName]);

  return { foundPlayers, showSpinner, thatIsYou, userAlreadyAdded };
};

export default useQueryForPlayers;
