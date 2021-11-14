import 'react-toastify/dist/ReactToastify.css';

import { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import styled from 'styled-components';

import api, { errHandler } from '@/api/api';
import parseUserData from '@/helper/parseUserData';

import ScrollDownIndicator from './components/common/ScrollDownIndicator/ScrollDownIndicator';
import MainContent from './components/pages/MainContent/MainContent';
import Menu from './components/pages/Menu/Menu';
import useIsMobile from './sharedHooks/useIsMobile';
import { useAppDispatch, useAppSelector } from './store/hooks';
import {
  selectIsLoggedIn,
  userIsFetchingData,
} from './store/reducer/appStatusReducer';
import {
  selectMyScoreSaberId,
  selectUserData,
  userDataUpdated,
} from './store/reducer/userDataReducer';
import { mediaQuery } from './tokens/definitions/layout';

import type { PossibleResponses } from '@/api/api';
import type { ScoreSaberUserInfo } from './sharedTypes';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 101vw;

  ${mediaQuery.sm} {
    flex-direction: row;
  }
`;

function App(): JSX.Element {
  const dispatch = useAppDispatch();
  const { isMobile } = useIsMobile();
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const myScoreSaberId = useAppSelector(selectMyScoreSaberId);
  const userData = useAppSelector(selectUserData);

  useEffect(() => {
    const fetchData = async (id: string): Promise<void> => {
      dispatch(
        userIsFetchingData({
          status: true,
          statusText: 'Fetching your data...',
        })
      );
      try {
        const scoreSaberUserInfo: ScoreSaberUserInfo =
          await api.userApi.getSSUserInfo(id);
        const scoresRecent = await api.userApi.getRecentUserScores(id);
        const parsedData = parseUserData(
          userData,
          scoreSaberUserInfo,
          scoresRecent
        );

        dispatch(userDataUpdated(parsedData));
      } catch (err: unknown) {
        errHandler(err as PossibleResponses);
      }

      dispatch(userIsFetchingData({ status: false }));
    };

    if (myScoreSaberId === undefined) return;

    void fetchData(myScoreSaberId);
  }, [myScoreSaberId]);

  return (
    <Container>
      {isLoggedIn && <Menu />}
      {isMobile && <ScrollDownIndicator />}
      <MainContent />
      <ToastContainer theme="dark" />
    </Container>
  );
}

export default App;
