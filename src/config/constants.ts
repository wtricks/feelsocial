import dotenv from 'dotenv';
import { join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

dotenv.config();

// Root directory
export const ROOT = join(fileURLToPath(import.meta.url), '..', '..');

// MongoDB URL
export const MONGODB_URL = process.env.MONGO_URI;

// JWT secret
export const JWT_SECRET = process.env.JWT_SECRET;

// CORS origin
export const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Server port
export const PORT = process.env.PORT || 5000;
