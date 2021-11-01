import { Route, useHistory } from 'react-router-dom';

import api from '@/api/api';

import type { ComponentType } from 'react';
import type { StaticContext } from 'react-router';
import type { RouteComponentProps } from 'react-router-dom';

type Props = {
  component:
    | ComponentType<
        RouteComponentProps<
          Record<string, string | undefined>,
          StaticContext,
          unknown
        >
      >
    | ComponentType<JSX.Element>;
  path: string;
};

function PrivateRoute({ component, path }: Props): JSX.Element {
  const isLoggedIn = api.authApi.isLoggedIn();
  const history = useHistory();

  if (!isLoggedIn) history.push('/');

  return <Route path={path} component={component} />;
}

export default PrivateRoute;
