/* eslint-disable no-console */
import type { Scores } from '@/sharedTypes';

type Props = {
  scores: Scores;
  tabId: string;
};
const ScoreTabs = ({ scores, tabId }: Props): JSX.Element => (
  <>
    {scores.map((score, i) => (
      <p key={`${tabId}${i}`}>
        {tabId}
        {score.scoreId}
      </p>
    ))}
  </>
);

export default ScoreTabs;
