import styled from 'styled-components';

import createImageUrl from '@/helper/createImageUrl';
import { useAppSelector } from '@/store/hooks';
import { selectUserData } from '@/store/reducer/userDataReducer';

const Container = styled.div`
  max-height: 100px;
  max-width: 100px;
`;

const Image = styled.img`
  border-radius 1.5625rem;
  margin-right: 1rem;
  max-width: 3.125rem;
`;

function GoogleProfileData(): JSX.Element | null {
  const userData = useAppSelector(selectUserData);
  const { profilePic, username = 'test' } = userData;
  const placeholderImage =
    profilePic !== undefined ? profilePic : createImageUrl('m_bee.jpg');

  return (
    <Container>
      <Image
        referrerPolicy="no-referrer" // avoids broken img due to 403 response from google
        src={placeholderImage}
        id="profile-pic-sm"
        alt="profile pic"
      />
      <span>{username}</span>
    </Container>
  );
}

export default GoogleProfileData;