import React from 'react';
import styled from 'styled-components';

import { mediaQuery } from '../../tokens/definitions/layout';

const Container = styled.div`
  ${mediaQuery.mobile} {
    margin-top: 20px;
  }
`;

const GoogleOAuth = (): JSX.Element => <Container>Google</Container>;

export default GoogleOAuth;
