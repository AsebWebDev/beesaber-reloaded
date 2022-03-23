import type { PlayedBy } from '@/../sharedTypes/UserScores';

type Props = {
  playedBy?: PlayedBy[];
};

const ToolTip = ({ playedBy }: Props) => {
  console.log('🚀 ~ file: ToolTip.tsx ~ line 8 ~ playedBy', playedBy);

  return (
    <>
      {playedBy?.map((bee) => (
        <p>{bee.playerName}</p>
      ))}
    </>
  );
};

export default ToolTip;
