import { errHandler, service } from './api';

import type { AxiosResponse } from 'axios';

type GoogleResponse = {
  googleId: string;
  profileObj: {
    imageUrl: string;
    name: string;
  };
};

const googleApi = {
  async googleLogin({ googleId, profileObj }: GoogleResponse) {
    return service
      .post<AxiosResponse>('/googlelogin', { googleId, profileObj })
      .then((res) => {
        // If we have localStorage.getItem('user') saved, the application will consider we are loggedin
        localStorage.setItem('user', JSON.stringify(res.data));

        return res.data;
      })
      .catch(errHandler);
  },
};

export type { GoogleResponse };
export default googleApi;
