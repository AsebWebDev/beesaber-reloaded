import { MDBBadge, MDBTooltip } from 'mdb-react-ui-kit';
import styled from 'styled-components';

import type { Bee } from '@/sharedTypes';

const BeeIcon = styled.i`
  padding-right: 0.5rem;
`;

type Props = {
  bee: Bee;
  handleSelect: (bee: Bee) => void;
};

const BeeTag = ({ bee, handleSelect }: Props): JSX.Element => {
  const { playerName } = bee;

  const tooltipContent = <p>{bee.playerId}</p>;

  return (
    <span
      key={`${bee.playerId}${bee.playerName}`}
      onClick={() => handleSelect(bee)}
    >
      <MDBTooltip tag="span" title={tooltipContent}>
        <MDBBadge color="warning">
          <BeeIcon className="fab fa-forumbee" aria-hidden="true" />
          {playerName}
        </MDBBadge>
      </MDBTooltip>
    </span>
  );
};

export default BeeTag;
