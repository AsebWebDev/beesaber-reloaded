import { skipToken } from '@reduxjs/toolkit/dist/query/react';
import styled from 'styled-components';

import { useGetUserDataQuery } from '@/api/services/apiUser/apiUser';
import { parseAvatarUrl } from '@/helper/urlParser';
import { useAppSelector } from '@/store/hooks';
import { selectUserId } from '@/store/reducer/userDataReducer';

const Container = styled.div`
  max-height: 100px;
`;

const Image = styled.img`
  border-radius 1.5625rem;
  margin-right: 1rem;
  max-width: 3.125rem;
`;

function GoogleProfileData(): JSX.Element | null {
  const userId = useAppSelector(selectUserId);
  const { data: userData } = useGetUserDataQuery(userId ?? skipToken);

  if (userData === undefined) return null;
  const { profilePic, username, googleName, googleImageUrl } = userData;

  const placeholderImage =
    profilePic !== undefined ? parseAvatarUrl(profilePic) : googleImageUrl;

  const name = username ?? googleName;

  return (
    <Container>
      <Image
        referrerPolicy="no-referrer" // avoids broken img due to 403 response from google
        src={placeholderImage}
        id="profile-pic-sm"
        alt="profile pic"
      />
      <span>{name}</span>
    </Container>
  );
}

export default GoogleProfileData;
