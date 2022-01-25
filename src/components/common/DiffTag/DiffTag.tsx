import React from 'react';
import styled from 'styled-components';

import type { Difficulty, DifficultyName } from '@/sharedTypes/UserScores';

const Tag = styled.span`
  margin: 1px 2px 1px 2px;
  max-height: 20px;
  max-width: fit-content;
  min-width: 50px;
`;

type BadgeColor =
  | 'danger'
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning';

type Props = {
  difficulty: Difficulty;
};

const DiffTag = ({ difficulty }: Props) => {
  let badgeColor: BadgeColor;
  let badgeText: DifficultyName | 'Oops';

  switch (difficulty) {
    case 1:
      badgeColor = 'success';
      badgeText = 'Easy';
      break;
    case 3:
      badgeColor = 'primary';
      badgeText = 'Normal';
      break;
    case 5:
      badgeColor = 'warning';
      badgeText = 'Hard';
      break;
    case 7:
      badgeColor = 'secondary';
      badgeText = 'Expert';
      break;
    case 9:
      badgeColor = 'danger';
      badgeText = 'Expert+';
      break;
    default:
      badgeColor = 'default';
      badgeText = 'Oops';
      break;
  }

  return <Tag className={`badge badge-${badgeColor}`}>{badgeText}</Tag>;
};

export default DiffTag;
