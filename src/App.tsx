import React from 'react';
import { Route, Switch } from 'react-router-dom';
import Dashboard from './components/pages/Dashboard';
import LandingPage from './components/pages/LandingPage';
import MyProfile from './components/pages/MyProfile';
import api from './api/api';

function App() {
  const isLoggedIn = false;
  const testUserId = '76561198333869741';
  api.userApi.getUserData(testUserId);

  return (
    <div className="App">
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
}

export default App;
