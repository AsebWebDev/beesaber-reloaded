/* eslint-disable no-console */
import { Route, Switch } from 'react-router-dom';
import styled from 'styled-components';

import Dashboard from '@/components/pages/Dashboard';
import LandingPage from '@/components/pages/LandingPage/LandingPage';
import MyHive from '@/components/pages/MyHive/MyHive';
import MyProfile from '@/components/pages/MyProfile/MyProfile';
import PrivateRoute from '@/components/tools/PrivateRoute/PrivateRoute';
import { useAppSelector } from '@/store/hooks';
import { selectIsLoggedIn } from '@/store/reducer/appStatusReducer';
import tokens from '@/tokens';
import { mediaQuery } from '@/tokens/definitions/layout';

import Header from './Header/Header';

const Container = styled.div`
  width: 100%;

  input {
    color: ${tokens.color.white.main}!important;
  }

  label {
    color: ${tokens.color.white.light}!important;
  }

  ${mediaQuery.sm} {
    padding-top: 1rem;
  }
`;

const MainContent = (): JSX.Element => {
  const isLoggedIn = useAppSelector(selectIsLoggedIn);

  return (
    <Container>
      {isLoggedIn && <Header />}
      <Switch>
        <Route
          path="/"
          exact
          component={isLoggedIn ? Dashboard : LandingPage}
        />
        <PrivateRoute path="/myprofile" component={MyProfile} />
        <PrivateRoute path="/myhive" component={MyHive} />
        <Route render={() => <h2>404</h2>} />
      </Switch>
    </Container>
  );
};

export default MainContent;
