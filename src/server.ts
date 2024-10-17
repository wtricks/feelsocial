import cors from 'cors';
import express from 'express';
import rateLimiter from 'express-rate-limit';
import path from 'path';

import { ROOT } from 'config/constants';
import { connectDB } from 'config/db';
import responseMiddleware from 'middlewares/responseMiddleware';

import authRoutes from 'routes/authRoutes';
import commentRouts from 'routes/commentRoutes';
import postRoutes from 'routes/postRoutes';
import userRoutes from 'routes/userRoutes';

const app = express();
app.set('trust proxy', 1);

const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

app.use(
  cors({
    origin: '*',
    optionsSuccessStatus: 200,
  })
);
app.use(express.json());
app.use(limiter);
app.disable('x-powered-by');
app.use(responseMiddleware);

// Static files
app.use('/uploads', express.static(path.join(ROOT, 'uploads')));

// Routes
app.get('/', (_req, res) => {
  res.send('Social Media Server - Backend');
});

// APIs
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRouts);

connectDB().then(() => {
  app.listen(5000, () => {
    console.log(`Server running on port ${5000}`);
  });
});

export default app;
