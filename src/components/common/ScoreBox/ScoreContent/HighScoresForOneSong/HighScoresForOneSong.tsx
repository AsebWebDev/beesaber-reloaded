import { formatDistance, subDays } from 'date-fns';
import { MDBBadge, MDBIcon, MDBTooltip } from 'mdb-react-ui-kit';
import styled from 'styled-components';

import { parseSongPicUrl } from '@/helper/urlParser';
import tokens from '@/tokens';

import type { Score } from '@/sharedTypes';
// import DiffTags from "../../DiffTag";
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
  const logid = (scoreId: string) => console.log('scoreId: !', scoreId);

  let scoreColorClass = '';

  if (highscore.playedByHive === true && highscore.playedBy !== undefined) {
    scoreColorClass =
      highscore.playedBy.filter((bee) => bee.myScore < bee.beeScore).length > 0
        ? 'played-by-hive-lost'
        : 'played-by-hive-won';
  }

  return (
    <tr className={scoreColorClass}>
      <td>
        <Badge>{highscore.rank}</Badge>
      </td>
      <td>
        <SongData>
          {/* <DiffTags diff={highscore.difficulty} /> */}
          <Img
            src={parseSongPicUrl(highscore.songHash)}
            alt={`Cover of ${highscore.songName}`}
          />
          {highscore.playedByHive === true && (
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
                    {/* {highscore.playedBy.map((bee, i) => (
                      <HighscoreTable bee={bee} key={i} />
                    ))} */}
                  </tbody>
                </table>
              </div>
            </MDBTooltip>
          )}
          <MDBBadge onClick={() => logid(highscore.songHash)} color="dark">
            {highscore.songAuthorName} - {highscore.songName}
            <span className="greyed-out"> by {highscore.levelAuthorName}</span>
          </MDBBadge>
        </SongData>
      </td>
      <td>
        <MDBBadge id="badge-light">{highscore.score}</MDBBadge>
      </td>
      <td className="time">
        <b className="card-link">
          {formatDistance(subDays(new Date(), 3), new Date(highscore.timeSet), {
            addSuffix: true,
          })}
        </b>
      </td>
    </tr>
  );
}

export default HighScoresForOneSong;
