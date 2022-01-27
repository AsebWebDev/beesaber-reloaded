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

import NeonText from '@/components/common/NeonText/NeonText';
import Spinner from '@/components/common/Spinner/SpinnerPulse';
import tokens from '@/tokens';

import useQueryForPlayers from './useQueryForPlayers';
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
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerInfo | null>(null);

  console.log(
    '🚀 ~ file: AddBeeModal.tsx ~ line 44 ~ selectedPlayer',
    selectedPlayer
  );
  const [activeItem, setActiveItem] = useState<Tab>('1');
  const searchBy = activeItem === '1' ? 'id' : 'name';
  const [query, setQuery] = useState('');
  const { foundUsers, showSpinner, thatIsYou, userAlreadyAdded } =
    useQueryForPlayers({ query, searchBy });

  useEffect(() => {
    if (foundUsers !== null && foundUsers.length === 1)
      setSelectedPlayer(foundUsers[0]);
    else setSelectedPlayer(null);
  }, [foundUsers]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setQuery(e.target.value);

  const handleChose = (player: PlayerInfo) => {
    console.log('handle chose: ', player);
  };

  const handleSave = () => {
    console.log('selected player is', selectedPlayer);
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
                <UserInfo foundUsers={foundUsers} handleChose={handleChose} />
              </MDBTabsContent>
            </MDBModalBody>

            {/* /// Show Buttons OR Status bar /// */}
            {!showSpinner && (
              <MDBModalFooter>
                {selectedPlayer !== null && !userAlreadyAdded && !thatIsYou && (
                  <MDBBtn color="success" onClick={handleSave}>
                    Add {selectedPlayer.playerName}
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
