import { MDBBadge, MDBTooltip } from 'mdb-react-ui-kit';
import styled from 'styled-components';

import tokens from '@/tokens';

import type { Bee } from '@/../sharedTypes';

const BeeIcon = styled.i`
  padding-right: 0.5rem;
`;

const TrashIcon = styled.i.attrs({ as: 'a' })`
  padding-left: 0.5rem;

  &:hover {
    color: ${tokens.color.red.main};
    cursor: pointer;
  }
`;

type Props = {
  bee: Bee;
  handleDelete: (bee: Bee) => Promise<void>;
  handleSelect: (bee: Bee) => void;
};

const BeeTag = ({ bee, handleDelete, handleSelect }: Props): JSX.Element => {
  const { playerName } = bee;

  const tooltipContent = <p>{bee.playerId}</p>;

  const handelDeleteClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    void handleDelete(bee);
  };

  return (
    <span
      key={`${bee.playerId}${bee.playerName}`}
      onClick={() => handleSelect(bee)}
    >
      <MDBTooltip tag="span" title={tooltipContent}>
        <MDBBadge color="warning">
          <BeeIcon className="fab fa-forumbee" aria-hidden="true" />
          {playerName}
          <TrashIcon className="fas fa-trash" onClick={handelDeleteClick} />
        </MDBBadge>
      </MDBTooltip>
    </span>
  );
};

export default BeeTag;
