import styled from 'styled-components';

import createLocalImageUrl from '@/helper/createLocalImageUrl';
import { parseAvatarUrl } from '@/helper/urlParser';

const Container = styled.img`
  margin-right: 1rem;
  max-width: 2rem;
`;

type Props = {
  avatar?: string;
  playerName: string;
};
const Avatar = ({ avatar, playerName }: Props): JSX.Element => {
  const url =
    avatar === '/images/steam.png' ||
    avatar === '/images/oculus.png' ||
    avatar === undefined
      ? createLocalImageUrl('bee.jpg')
      : parseAvatarUrl(avatar);

  return <Container src={url} alt={`Avatar of player ${playerName}`} />;
};

export default Avatar;
