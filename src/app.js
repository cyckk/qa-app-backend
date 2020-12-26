require('dotenv').config();

import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import user from './routes/user';

const MONGODB_URI = process.env.MONGODB_URI;

// console.log(process.env.MONGODB_URI);
// console.log(MONGODB_URI);

// let token =
//   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
// console.log(jwt.decode(token));

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('connected to mongodb ');
  })
  .catch((err) => {
    console.log('Error while connecting ', err.message);
  });

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use(user);

export default app;
