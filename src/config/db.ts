import mongoose from 'mongoose';
import { MONGODB_URL } from './constants';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URL!, {
      /** Add options */
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error('An unknown error occurred while connecting to MongoDB');
    }
    process.exit(1);
  }
};
