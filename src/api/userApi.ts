import axios from 'axios';
import mongoose from 'mongoose';
import errHandler from './errorHandler';

const service = axios.create({
  baseURL:
    process.env.NODE_ENV === 'production'
      ? '/api'
      : 'http://localhost:5000/api',
  withCredentials: true,
});

const validId = (id: string) => mongoose.Types.ObjectId.isValid(id);

const userApi = {
  service,
  getUserData(userId: string) {
    if (validId(userId))
      return service
        .get('/user/' + userId)
        .then((res) => console.log(res.data))
        .catch(errHandler);
    else return Promise.resolve();
  },
};

export default userApi;
