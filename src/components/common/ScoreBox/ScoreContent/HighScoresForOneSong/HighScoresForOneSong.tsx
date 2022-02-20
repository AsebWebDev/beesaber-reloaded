import { formatDistance, subDays } from 'date-fns';
import { MDBBadge, MDBIcon, MDBTooltip } from 'mdb-react-ui-kit';
import styled from 'styled-components';

import DiffTag from '@/components/common/DiffTag/DiffTag';
import { parseSongPicUrl } from '@/helper/urlParser';
import tokens from '@/tokens';

import type { Score } from '@/sharedTypes';
// import HighscoreTable from "./HighscoreTable";

const Badge = styled(MDBBadge)`
  color: ${tokens.color.page.bgColor}!important;
  min-width: 30px;
`;

const Img = styled.img`
  max-width: 50px;
  max-height: 30px;
  border-radius: 20px;
`;

const SongData = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

type Props = {
  highscore: Score;
};

function HighScoresForOneSong({ highscore }: Props): JSX.Element | null {
  const {
    difficulty,
    levelAuthorName,
    playedBy,
    playedByHive,
    rank,
    score,
    scoreId,
    songAuthorName,
    songHash,
    songName,
    timeSet,
  } = highscore;
  const logid = (id: string) => console.log('id: !', id);

  let scoreColorClass = '';

  if (playedByHive === true && playedBy !== undefined) {
    scoreColorClass =
      playedBy.filter((bee) => bee.myScore < bee.beeScore).length > 0
        ? 'played-by-hive-lost'
        : 'played-by-hive-won';
  }

  return (
    <tr key={scoreId} className={scoreColorClass}>
      <td>
        <Badge>{rank}</Badge>
      </td>
      <td>
        <SongData>
          <DiffTag difficulty={difficulty} />
          <Img src={parseSongPicUrl(songHash)} alt={`Cover of ${songName}`} />
          {playedByHive === true && (
            <MDBTooltip domElement clickable tag="span" placement="top">
              <span>
                <MDBIcon far icon="handshake" />
              </span>
              <div className="also-played-by">
                <table>
                  <thead>
                    <tr>
                      <th>Bee</th>
                      <th>Score</th>
                      <th>My Score</th>
                    </tr>
                  </thead>
                  <tbody id="bees">
                    {/* {playedBy.map((bee, i) => (
                      <HighscoreTable bee={bee} key={i} />
                    ))} */}
                  </tbody>
                </table>
              </div>
            </MDBTooltip>
          )}
          <MDBBadge onClick={() => logid(songHash)} color="dark">
            {songAuthorName} - {songName}
            <span className="greyed-out"> by {levelAuthorName}</span>
          </MDBBadge>
        </SongData>
      </td>
      <td>
        <MDBBadge id="badge-light">{score}</MDBBadge>
      </td>
      <td className="time">
        <b className="card-link">
          {formatDistance(subDays(new Date(), 3), new Date(timeSet), {
            addSuffix: true,
          })}
        </b>
      </td>
    </tr>
  );
}

export default HighScoresForOneSong;
