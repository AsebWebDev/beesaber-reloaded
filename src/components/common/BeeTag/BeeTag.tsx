import { MDBBadge, MDBTooltip } from 'mdb-react-ui-kit';
import { useState } from 'react';
import styled from 'styled-components';

import tokens from '@/tokens';

import Tooltip from './Tooltip/Tooltip';

import type { Bee } from '@/../sharedTypes';

const BeeIcon = styled.i`
  padding-right: 0.5rem;
`;

const TrashIcon = styled.i.attrs({ as: 'a' })<{ isClicked: boolean }>`
  padding-left: 0.5rem;

  &:hover {
    color: ${tokens.color.red.main};
    cursor: ${({ isClicked }) => (isClicked ? `not-allowed` : `pointer`)};
  }
`;

type Props = {
  bee: Bee;
  handleDelete: (bee: Bee) => void;
  handleSelect: (bee: Bee) => void;
  isSelected: boolean;
};

const BeeTag = ({
  bee,
  handleDelete,
  handleSelect,
  isSelected,
}: Props): JSX.Element => {
  const [isClicked, setIsClicked] = useState(false);
  const { playerName } = bee;

  const handleSelectClick = (
    e: React.MouseEvent<HTMLElement>,
    selectedBee: Bee
  ) => {
    e.preventDefault();
    e.stopPropagation();
    handleSelect(selectedBee);
  };

  const handelDeleteClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsClicked(true);
    handleDelete(bee);
  };

  const badgeColor = isClicked ? 'danger' : isSelected ? 'info' : 'warning';

  return (
    <span
      key={`${bee.playerId}${bee.playerName}`}
      onClick={(e) => handleSelectClick(e, bee)}
    >
      <MDBTooltip tag="span" title={<Tooltip bee={bee} />}>
        <MDBBadge color={badgeColor}>
          <BeeIcon className="fab fa-forumbee" aria-hidden="true" />
          {playerName}

          <TrashIcon
            aria-label={`delete ${playerName}`}
            className="fas fa-trash"
            isClicked={isClicked}
            onClick={handelDeleteClick}
          />
        </MDBBadge>
      </MDBTooltip>
    </span>
  );
};

export default BeeTag;
