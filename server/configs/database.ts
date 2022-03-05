import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });

const uri = process.env.DB_URI;

mongoose
  .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((x) => {
    console.log(
      `Connected to Mongo! Database name: "${x.connections[0].name}"`
    );
  })
  .catch((err) => {
    console.error('Error connecting to mongo', err);
  });
