import {
  MDBBtn,
  MDBContainer,
  MDBInput,
  MDBModal,
  MDBModalBody,
  MDBModalContent,
  MDBModalDialog,
  MDBModalFooter,
  MDBModalHeader,
  MDBTabs,
  MDBTabsContent,
  MDBTabsItem,
  MDBTabsLink,
  MDBTabsPane,
} from 'mdb-react-ui-kit';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import {
  useGetFullPlayerQuery,
  useGetPlayersByNameQuery,
} from '@/api/services/apiPlayer/apiPlayer';
import { useGetUserDataQuery } from '@/api/services/apiUser/apiUser';
import NeonText from '@/components/common/NeonText/NeonText';
import Spinner from '@/components/common/Spinner/SpinnerPulse';
import useDebounce from '@/sharedHooks/useDebounce';
import { useAppSelector } from '@/store/hooks';
import { selectUserId } from '@/store/reducer/userDataReducer';
import tokens from '@/tokens';

import UserInfo from './UserInfo/UserInfo';

import type { PlayerInfo } from '@/sharedTypes/ScoreSaberUserInfo';

const ModalContent = styled(MDBModalContent)`
  background-color: ${tokens.color.page.bgColor.light};
  color: ${tokens.color.white.main};
  margin-top: 10rem;
  width: fit-content;
`;

type Props = {
  toggleModal: () => void;
};

type Tab = '1' | '2';

const AddBeeModal = ({ toggleModal }: Props): JSX.Element | null => {
  const userId = useAppSelector(selectUserId);
  const { data: userData } = useGetUserDataQuery(userId);

  if (userData === undefined) return null;
  const { bees, myScoreSaberId } = userData;
  const [activeItem, setActiveItem] = useState<Tab>('1');
  const [query, setQuery] = useState('');
  const [foundUser, setFoundUser] = useState<PlayerInfo | null>(null);
  const [foundUsers, setFoundUsers] = useState<PlayerInfo[] | null>(null);
  const [userAlreadyAdded, setUserAlreadyAdded] = useState(false);
  const [thatIsYou, setThatIsYou] = useState(false);
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

  const cleanUp = () => {
    setFoundUser(null);
    setFoundUsers(null);
    setUserAlreadyAdded(false);
    setThatIsYou(false);
  };

  useEffect(() => {
    cleanUp();
    const players = activeItem === '1' ? playerById?.playerInfo : playersByName;

    if (players === undefined) return;

    // If result is an array, multiple Users have been found...
    if (Array.isArray(players) && players.length > 1) setFoundUsers(players);
    // If result is an array of 1 element, only one user has been found...
    if (Array.isArray(players) && players.length === 1)
      setFoundUser(players[0]);
    // If result is not an array (searching by ID) only one user had been found...
    if (!Array.isArray(players)) setFoundUser(players);
  }, [playerById, playersByName]);

  useEffect(() => {
    const searchHasError =
      (activeItem === '1' && errorById !== undefined) ||
      (activeItem === '2' && errorByName !== undefined);

    if (searchHasError) {
      setFoundUser(null);
      setFoundUsers(null);
    }
  }, [errorById, errorByName]);

  useEffect(() => {
    if (foundUser !== null) setThatIsYou(foundUser.playerId === myScoreSaberId);
  }, [foundUser]);

  useEffect(() => {
    // check if user alread exists in bees list
    if (foundUser && bees.length > 0)
      setUserAlreadyAdded(
        bees.some((item) => item.playerId === foundUser.playerId)
      );
  }, [foundUser, bees]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setQuery(e.target.value);

  const handleChose = (player: PlayerInfo) => {
    setFoundUser(player);
    setFoundUsers(null);
  };

  const handleSave = async () => {
    // if (!userAlreadyAdded) {
    //     let userdata = {}
    //     setProcessing({status: true, statusText: 'Adding ' + foundUser.playerName + ' to your hive' })
    //     // If the found user is coming from an array (more than one user found, one needs
    // to be picked of the Array on UI) there is
    //     // only few data coming from the api, so we need complete user data
    //     if (!foundUser.hasOwnProperty('totalPlayCount'))
    //     await api.getScoreSaberUserInfo(foundUser.playerId, 'id')
    //         .then( ScoreSaberUserInfo => userdata = { ...userdata, ...ScoreSaberUserInfo } )
    //     // Get scores from the found user to the userdata and finally save it to the database
    //     await api.getScores(foundUser.playerId).then((scoreData) => {
    //         userdata = { ...userdata, ...foundUser, scoreData }
    //         api.saveBee(props.userdata._id, userdata)
    //             .then(userdata => dispatch({ type: "UPDATE_USER_DATA", userdata }))
    //     }).catch(err => dispatch(newNotification({text: err.message ? err.message : err})))
    //     dispatch(newNotification({text: "User " + foundUser.playerName + " successfully added."}))
    //     setProcessing({status: false, statusText: null })
    //     setQuery('')
    //     cleanUp()
    // } else dispatch(newNotification({text: "Sorry, user is already in you hive."}))
  };

  const switchTab = (tab: Tab) => {
    setQuery('');
    cleanUp();
    if (activeItem !== tab) setActiveItem(tab);
  };

  return (
    <MDBContainer>
      <MDBModal staticBackdrop show={true}>
        <MDBModalDialog>
          <ModalContent>
            <MDBModalHeader>Add a new Bee</MDBModalHeader>
            <MDBModalBody>
              <MDBTabs className="mb-3">
                <MDBTabsItem>
                  <MDBTabsLink
                    onClick={() => switchTab('1')}
                    active={activeItem === '1'}
                  >
                    Search by Id
                  </MDBTabsLink>
                </MDBTabsItem>
                <MDBTabsItem>
                  <MDBTabsLink
                    onClick={() => switchTab('2')}
                    active={activeItem === '2'}
                  >
                    Search by Username
                  </MDBTabsLink>
                </MDBTabsItem>
              </MDBTabs>

              <MDBTabsContent>
                <MDBTabsPane show={activeItem === '1'}>
                  <MDBInput
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleChange(e)
                    }
                    value={query}
                    label="Search ID"
                    icon="hashtag"
                    type="number"
                    error="wrong"
                    success="right"
                  />
                </MDBTabsPane>
                <MDBTabsPane show={activeItem === '2'}>
                  <MDBInput
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleChange(e)
                    }
                    value={query}
                    label="Search Username"
                    icon="user"
                    type="text"
                    error="wrong"
                    success="right"
                  />
                </MDBTabsPane>
                {/* {foundUser && <UserInfo userInfoData={foundUser}/>} */}
                {/* {foundUser?.playerName} */}
                {/* {foundUsers?.map(user => <UserInfo userInfoData={user} handleChose={handleChose}/>)} */}
                <UserInfo
                  foundUsers={foundUser !== null ? [foundUser] : foundUsers}
                  handleChose={handleChose}
                />
                {/* {foundUsers?.map((user) => user.playerName)} */}
              </MDBTabsContent>
            </MDBModalBody>

            {/* /// Show Buttons OR Status bar /// */}
            {!showSpinner && (
              <MDBModalFooter>
                {foundUser && !userAlreadyAdded && !thatIsYou && (
                  <MDBBtn color="success" onClick={handleSave}>
                    Add {foundUser.playerName}
                  </MDBBtn>
                )}
                <MDBBtn color="danger" onClick={toggleModal}>
                  Close
                </MDBBtn>
              </MDBModalFooter>
            )}
            {showSpinner && (
              <MDBModalFooter>
                <NeonText glow as={'h2'} titleColor={'blue'}>
                  Searching...
                </NeonText>
                <Spinner />
              </MDBModalFooter>
            )}
          </ModalContent>
        </MDBModalDialog>
      </MDBModal>
    </MDBContainer>
  );
};

export default AddBeeModal;
