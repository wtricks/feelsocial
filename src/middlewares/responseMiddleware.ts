import { type Request, type Response } from 'express';

/**
 * Express middleware to add a function to the response object called `sendResponse`
 *
 * This function allows for a more consistent API response format
 * throughout the application. The response format is as follows:
 */
const responseMiddleware = (_req: Request, res: Response, next: () => void) => {
  res.sendResponse = <T>(
    statusCode: number,
    message: string,
    hasError?: boolean,
    data?: T
  ) => {
    return res.status(statusCode).json({
      message,
      ...(hasError ? { errors: data } : { data }),
    });
  };

  next();
};

export default responseMiddleware;
