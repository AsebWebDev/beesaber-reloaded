// eslint-disable-next-line import/no-unassigned-import
import './NeonButton.scss';

import { MDBIcon } from 'mdb-react-ui-kit';
import React from 'react';

type Props = {
  logo: string;
  text: string;
};

const NeonButton = ({ logo, text }: Props): JSX.Element => (
  <div id="neon-button">
    <div id="button">
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <MDBIcon fab icon={logo || ''} /> {text}
    </div>
  </div>
);

export default NeonButton;
