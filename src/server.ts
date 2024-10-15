import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimiter from 'express-rate-limit';
import path from 'path';

import { ROOT } from 'config/constants';
import { connectDB } from 'config/db';

dotenv.config({
  path: `.env.${process.env.NODE_ENV}`,
});

const app = express();
const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    optionsSuccessStatus: 200,
  })
);
app.use(express.json());
app.use(limiter);
app.disable('x-powered-by');

// Static files
app.use('/uploads', express.static(path.join(ROOT, 'uploads')));

// Routes
app.get('/', (_req, res) => {
  res.send('Social Media Server - Backend');
});

connectDB().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
});
