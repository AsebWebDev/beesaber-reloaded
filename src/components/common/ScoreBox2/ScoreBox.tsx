/* eslint-disable no-console */
import useBuildScoreData from '@/sharedHooks/useBuildScoreData';

type Props = {
  id: string;
};

const ScoreBox = ({ id }: Props): JSX.Element | null => {
  const scoreData = useBuildScoreData(id, 10);

  console.log('FINAL: ', scoreData);

  return <div>test</div>;
};

export default ScoreBox;
