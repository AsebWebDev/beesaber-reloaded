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
  MDBNavbar,
  MDBNavbarItem,
  MDBNavbarLink,
  MDBTabs,
  MDBTabsContent,
  MDBTabsItem,
  MDBTabsLink,
  MDBTabsPane,
} from 'mdb-react-ui-kit';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { useGetUserDataQuery } from '@/api/services/apiUser/apiUser';
import { useAppSelector } from '@/store/hooks';
import { selectUserId } from '@/store/reducer/userDataReducer';
import tokens from '@/tokens';

import type { Bee, UserData } from '@/sharedTypes';

const ModalContent = styled(MDBModalContent)`
  background-color: ${tokens.color.page.bgColor.light};
  color: ${tokens.color.white.main};
`;

// import { newNotification } from '../actioncreators'
// import UserInfo from './UserInfo.jsx';
// import Spinner from './Spinner';
// import Message from './Message';

type Props = {
  toggleModal: () => void;
};

type Processing = {
  status: boolean;
  statusText: string | null;
};

type Tab = '1' | '2';

const AddBeeModal = ({ toggleModal }: Props): JSX.Element | null => {
  const userId = useAppSelector(selectUserId);
  const { data: userData } = useGetUserDataQuery(userId);

  if (userData === undefined) return null;
  const { bees } = userData;
  const [activeItem, setActiveItem] = useState<Tab>('1');
  const [query, setQuery] = useState('');
  const [foundUser, setFoundUser] = useState<Bee | null>(null);
  const [foundUsers, setFoundUsers] = useState<Bee[] | null>(null);
  const [userAlreadyAdded, setUserAlreadyAdded] = useState(false);
  const [processing, setProcessing] = useState<Processing>({
    status: false,
    statusText: null,
  });
  const [thatIsYou, setThatIsYou] = useState(false);

  useEffect(() => {
    // check if user alread exists in bees list
    if (foundUser && bees.length > 0)
      setUserAlreadyAdded(
        bees.some((item) => item.playerId === foundUser.playerId)
      );
  }, [foundUser, bees]);

  const cleanUp = () => {
    setFoundUser(null);
    setFoundUsers(null);
    setUserAlreadyAdded(false);
    setThatIsYou(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setQuery(e.target.value);

  const handleSearch = () => {
    cleanUp();
    // const mode = activeItem === '1' ? 'id' : 'username';

    setProcessing({ status: true, statusText: 'Searching...' });
    // await api.getScoreSaberUserInfo(query, mode)
    //     .then(result => {
    //         if (!result) {
    //             dispatch(newNotification({text: "Sorry, user could not be found."}))
    //             return
    //         }
    //         if (Array.isArray(result)) {
    // If result is an array, multiple Users have been found...
    //             if (result.length === 1) setFoundUser(result[0])
    // If array only has one item, set it as single found user
    //             else setFoundUsers(result)
    // else add all found users to foundUsers in state
    //         } else {
    //             setFoundUser(result)
    // If its not an array, only one user is found and can be added to foundUser
    //             setThatIsYou(result.playerId === userdata.myScoreSaberId)   // check, if you found yourself
    //         }
    //     }).catch(err => dispatch(newNotification({text: err.message ? err.message : err})))
    setProcessing({ status: false, statusText: null });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleChose = (bee: Bee) => {
    setFoundUser(bee);
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
    <div id="addbeesmodal">
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
                      onKeyPress={handleKeyPress}
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
                      onKeyPress={handleKeyPress}
                    />
                  </MDBTabsPane>
                </MDBTabsContent>
              </MDBModalBody>

              {/* /// Show Buttons OR Status bar /// */}
              {!processing.status && (
                <MDBModalFooter>
                  {query !== '' && (
                    <MDBBtn color="primary" onClick={handleSearch}>
                      Search
                    </MDBBtn>
                  )}
                  <MDBBtn color="secondary" onClick={toggleModal}>
                    Close
                  </MDBBtn>
                  {foundUser && !userAlreadyAdded && !thatIsYou && (
                    <MDBBtn color="success" onClick={handleSave}>
                      Add {foundUser.playerName}
                    </MDBBtn>
                  )}
                </MDBModalFooter>
              )}
              {processing.status && (
                <MDBModalFooter>
                  {/* {processing.status && <Spinner text={processing.statusText}/>} */}
                </MDBModalFooter>
              )}
            </ModalContent>
          </MDBModalDialog>
        </MDBModal>
      </MDBContainer>
    </div>
  );
};

export default AddBeeModal;
