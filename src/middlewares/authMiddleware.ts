import { JWT_SECRET } from 'config/constants';
import { type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Authentication middleware to verify the user's JWT token
 * If the token is not present in the request headers, or the token is invalid,
 * the middleware will return a 401 Unauthorized response
 * @param req - The request object
 * @param res - The response object
 * @param next - The next middleware function to call
 */
const authMiddleware = (req: Request, res: Response, next: () => void) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.sendResponse(401, 'Unauthorized access', true);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET!);
    req.user = decoded as { id: string };
    return next();
  } catch (error: unknown) {
    console.log(error);
    return res.sendResponse(401, 'Unauthorized access', true);
  }
};

export default authMiddleware;
