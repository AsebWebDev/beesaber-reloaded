import { Route, Switch, useLocation } from 'react-router-dom';

import { useAppSelector } from '../../../store/hooks';
import { selectIsLoggedIn } from '../../../store/reducer/appStatusReducer';
import Dashboard from '../Dashboard';
import LandingPage from '../LandingPage/LandingPage';
import MyProfile from '../MyProfile';

const MainContent = (): JSX.Element => {
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const location = useLocation();

  // eslint-disable-next-line no-console
  console.log(location.pathname);

  return (
    <div>
      <Switch>
        <Route
          path="/"
          exact
          component={isLoggedIn ? Dashboard : LandingPage}
        />
        <Route path="/myprofile" component={MyProfile} />
        <Route render={() => <h2>404</h2>} />
      </Switch>
    </div>
  );
};

export default MainContent;
