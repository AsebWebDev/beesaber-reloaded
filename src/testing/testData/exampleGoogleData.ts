import type { GooglePayload, GoogleUserData } from '@/../sharedTypes';

const exampleGooglePayLoad: GooglePayload = {
  googleId: '111222333',
  profileObj: {
    email: 'example@example.com',
    familyName: 'Darth George Vader',
    givenName: 'Darthy',
    googleId: '987612345',
    imageUrl: 'www.exampleurl.de/image',
    name: 'Darth Vader',
  },
};

const exampleGoogleUserData: GoogleUserData = {
  _id: '1131345251351516',
  googleImageUrl: 'www.exampleurl.de/image',
  googleName: 'Darth Vader',
  myScoreSaberId: '123',
  profilePic: 'www.exampleurl.de/image',
  username: 'darthVader',
};

// eslint-disable-next-line import/prefer-default-export
export { exampleGooglePayLoad, exampleGoogleUserData };
