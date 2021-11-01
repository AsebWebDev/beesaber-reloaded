import { Route, Switch } from 'react-router-dom';
import styled from 'styled-components';

import PrivateRoute from '@/components/tools/PrivateRoute/PrivateRoute';
import { useAppSelector } from '@/store/hooks';
import { selectIsLoggedIn } from '@/store/reducer/appStatusReducer';

import Dashboard from '../Dashboard';
import LandingPage from '../LandingPage/LandingPage';
import MyProfile from '../MyProfie/MyProfile';

const Container = styled.div`
  width: 75%;
`;

const MainContent = (): JSX.Element => {
  const isLoggedIn = useAppSelector(selectIsLoggedIn);

  return (
    <Container>
      <Switch>
        <Route
          path="/"
          exact
          component={isLoggedIn ? Dashboard : LandingPage}
        />
        <PrivateRoute path="/myprofile" component={MyProfile} />
        <Route render={() => <h2>404</h2>} />
      </Switch>
    </Container>
  );
};

export default MainContent;
