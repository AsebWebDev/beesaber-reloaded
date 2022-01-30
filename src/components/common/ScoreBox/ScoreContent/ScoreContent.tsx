/* eslint-disable no-console */
import { MDBTable, MDBTableBody, MDBTableHead } from 'mdb-react-ui-kit';
import styled from 'styled-components';

import tokens from '@/tokens';

import HighScoresForOneSong from './HighScoresForOneSong/HighScoresForOneSong';

import type { Scores } from '@/sharedTypes';

const TableHead = styled(MDBTableHead)`
  color: ${tokens.color.yellow.main};
`;

const TableBody = styled(MDBTableBody)`
  color: ${tokens.color.white.main};
`;

type Props = {
  scores: Scores;
  tabId: string;
};

const ScoreContent = ({ scores }: Props): JSX.Element => (
  <MDBTable>
    <TableHead>
      <tr>
        <th scope="col">Rank</th>
        <th scope="col">Song</th>
        <th scope="col">Score</th>
        <th scope="col">Time</th>
      </tr>
    </TableHead>
    <TableBody>
      {scores.map((score) => (
        <HighScoresForOneSong highscore={score} key={score.scoreId} />
      ))}
    </TableBody>
  </MDBTable>
);

export default ScoreContent;
