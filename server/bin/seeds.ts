import mongoose from 'mongoose';
import User from '../models/User';
import bcrypt from 'bcrypt';
import '../configs/database';

const seedDB = () => {
  console.log('Seed triggered');

  const bcryptRounds = 10;
  const users = [
    {
      username: 'admin',
      password: bcrypt.hashSync(
        process.env.ADMIN_PASSWORD,
        bcrypt.genSaltSync(bcryptRounds)
      ),
      isAdmin: true,
    },
    {
      username: 'franzi',
      password: bcrypt.hashSync(
        process.env.ADMIN_PASSWORD,
        bcrypt.genSaltSync(bcryptRounds)
      ),
      isAdmin: true,
    },
    {
      username: 'nina',
      password: bcrypt.hashSync(
        process.env.ADMIN_PASSWORD,
        bcrypt.genSaltSync(bcryptRounds)
      ),
      isAdmin: true,
    },
  ];

  Promise.all([User.deleteMany()])
    .then(() => User.create(users))
    .then(() => mongoose.disconnect())
    .catch((err) => {
      mongoose.disconnect();
      throw err;
    });
};

seedDB();

export default seedDB;
