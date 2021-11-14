/* eslint-disable no-console */
import type { Scores } from '@/sharedTypes';

type Props = {
  scores: Scores;
  tabId: string;
};
const ScoreTabs = ({ scores, tabId }: Props): JSX.Element => {
  console.log('🚀 ~ file: ScoreTabs.tsx ~ line 9 ~ ScoreTabs ~ scores', scores);
  console.log('🚀 ~ file: ScoreTabs.tsx ~ line 7 ~ ScoreTabs ~ tabId', tabId);

  return <div>ScoreTabs</div>;
};

export default ScoreTabs;
