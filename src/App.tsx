/* eslint-disable no-console */
import 'react-toastify/dist/ReactToastify.css';

import { skipToken } from '@reduxjs/toolkit/query/react';
import { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import styled from 'styled-components';

import api, { errHandler } from '@/api/api';
import parseUserData from '@/helper/parseUserData';

import {
  useGetFullPlayerQuery,
  useGetRecentScoresUrlQuery,
} from './api/services/apiUser/apiUser';
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
  const { data: myScoreSaberId2 } = useGetRecentScoresUrlQuery(
    myScoreSaberId ?? skipToken
  );
  const { data: fullPlayer } = useGetFullPlayerQuery(
    myScoreSaberId ?? skipToken
  );

  console.log('🚀 ~ file: App.tsx ~ line 51 ~ App ~ fullPlayer', fullPlayer);
  console.log('🚀 ~ file: App.tsx ~ line 50 ~ App ~ data', myScoreSaberId2);

  useEffect(() => {
    const fetchData = async (id: string): Promise<void> => {
      // TODO: redirect to MyProfile or show an info message CTA set ScoreSaberID
      if (id.length === 0) return;
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
      <ToastContainer theme="dark" pauseOnFocusLoss={false} />
    </Container>
  );
}

export default App;
