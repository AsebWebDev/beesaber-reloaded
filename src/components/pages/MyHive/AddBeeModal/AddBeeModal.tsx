import { skipToken } from '@reduxjs/toolkit/dist/query/react';
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
import { toast } from 'react-toastify';
import styled from 'styled-components';

import {
  useGetUserDataQuery,
  useUpdateUserDataMutation,
} from '@/api/services/apiUser/apiUser';
import getAllScores from '@/api/services/helper/getAllScores';
import Alert from '@/components/common/Message/Message';
import NeonText from '@/components/common/NeonText/NeonText';
import Spinner from '@/components/common/Spinner/SpinnerPulse';
import { useAppSelector } from '@/store/hooks';
import { selectUserId } from '@/store/reducer/userDataReducer';
import tokens from '@/tokens';

import FoundPlayersList from './FoundPlayersList/FoundPlayersList';
import useQueryForPlayers from './useQueryForPlayers';

import type { Bee } from '@/../sharedTypes';
import type { PlayerInfo } from '@/../sharedTypes/ScoreSaberUserInfo';

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
  const [activeItem, setActiveItem] = useState<Tab>('1');
  const [query, setQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<
    PlayerInfo | undefined
  >();
  const [beeToAdd, setBeeToAdd] = useState<Bee | undefined>();
  const searchBy = activeItem === '1' ? 'id' : 'name';
  const [updateUser] = useUpdateUserDataMutation();
  const userId = useAppSelector(selectUserId);
  const { data: userData } = useGetUserDataQuery(userId ?? skipToken);

  const { foundPlayers, showSpinner, thatIsYou, userAlreadyAdded } =
    useQueryForPlayers({ query, searchBy });

  useEffect(() => {
    if (foundPlayers !== null && foundPlayers.length === 1)
      setSelectedPlayer(foundPlayers[0]);
    else {
      setBeeToAdd(undefined);
      setSelectedPlayer(undefined);
    }
  }, [foundPlayers]);

  useEffect(() => {
    if (selectedPlayer === undefined) return;
    const { playerId, playerName } = selectedPlayer;
    const buildBee = async () => {
      const scoreData = await getAllScores(playerId);

      setBeeToAdd({
        playerId,
        playerName,
        scoreData,
      });
    };

    void buildBee();
  }, [selectedPlayer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setQuery(e.target.value);

  const handleSelect = (player: PlayerInfo) => {
    // select or toggle off player
    setSelectedPlayer(player === selectedPlayer ? undefined : player);
    setBeeToAdd(undefined);
  };

  const handleSave = async () => {
    if (
      userAlreadyAdded ||
      userData === undefined ||
      beeToAdd === undefined ||
      userId === undefined
    )
      return;

    await toast.promise(
      updateUser({
        userId,
        userData: { bees: [...userData.bees, beeToAdd] },
      }),
      {
        pending: `Saving ${beeToAdd.playerName}...`,
        success: `user ${beeToAdd.playerName} has been saved 👌`,
        error: `There has been an issue saving ${beeToAdd.playerName} 🤯`,
      }
    );
    setQuery('');
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
                    aria-label="Search ID"
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
                    aria-label="Search Username"
                    label="Search Username"
                    icon="user"
                    type="text"
                    error="wrong"
                    success="right"
                  />
                </MDBTabsPane>
                <FoundPlayersList
                  foundPlayers={selectedPlayer ?? foundPlayers}
                  handleSelect={handleSelect}
                />
              </MDBTabsContent>
            </MDBModalBody>

            {/* /// Show Buttons OR Status bar /// */}
            {!showSpinner && (
              <MDBModalFooter>
                {beeToAdd !== undefined && !userAlreadyAdded && !thatIsYou && (
                  <MDBBtn color="success" onClick={handleSave}>
                    Add {beeToAdd.playerName}
                  </MDBBtn>
                )}
                {beeToAdd === undefined && selectedPlayer !== undefined && (
                  <Spinner />
                )}
                {thatIsYou && (
                  <Alert
                    text={
                      'You found yourself! What a noble goal in life, but not helping you on Beesaber ;)'
                    }
                    type={'primary'}
                  />
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
