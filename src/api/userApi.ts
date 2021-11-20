import {
  parseFullPlayerQueryUrl,
  parseGetRecentScoresUrl,
} from '@/helper/urlParser';

import { errHandler, service } from './api';

import type { AxiosResponse } from 'axios';
import type { ScoreSaberUserInfo, UserData, UserScores } from '@/sharedTypes';
import type { PossibleResponses } from './api';

const ErrorCodes = [404, 429, 422];

type ApiCallProps = {
  method?: 'get' | 'post';
  payload?: Partial<UserData>;
  url: string;
};

type UserApiResponse = ScoreSaberUserInfo | UserData | UserScores;

const doApiCall = async ({
  url,
  method = 'get',
  payload,
}: ApiCallProps): Promise<UserApiResponse> => {
  try {
    const response: AxiosResponse<UserApiResponse> = await service[method](
      url,
      payload
    );

    if (ErrorCodes.includes(response.status)) throw new Error();

    return response.data;
  } catch (err: unknown) {
    errHandler(err as PossibleResponses);
    throw new Error();
  }
};

const userApi = {
  async getRecentUserScores(id: string): Promise<UserScores> {
    const url = parseGetRecentScoresUrl(id);
    const recentScores = await doApiCall({ url });

    return recentScores as UserScores;
  },
  async getSSUserInfo(id: string): Promise<ScoreSaberUserInfo> {
    const url = parseFullPlayerQueryUrl(id);
    const result = await doApiCall({ url });

    return result as ScoreSaberUserInfo;
  },

  async getUserData(userId: string): Promise<UserData> {
    const url = `/user/${userId}`;
    const result = await doApiCall({ url });

    return result as UserData;
  },

  async saveUserData(
    userId: string,
    userdata: Partial<UserData>
  ): Promise<UserData> {
    const url = `/user/${userId}`;
    const result = await doApiCall({ url, method: 'post', payload: userdata });

    return result as UserData;
  },
};

export default userApi;
