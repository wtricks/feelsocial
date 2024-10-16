import { type Request, type Response } from 'express';
import { validationResult } from 'express-validator';

/**
 * Express middleware that checks for validation errors in the request.
 * If there are validation errors, it calls {@link Response.sendResponse} with a 400 status code,
 * a message "Validation failed", and the validation errors.
 * Otherwise, it calls the next middleware function.
 *
 * @param req - The request object
 * @param res - The response object
 * @param next - The next middleware function to call
 */
const validationMiddleware = (
  req: Request,
  res: Response,
  next: () => void
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.sendResponse(400, 'Validation failed', true, errors.array());
  }
  return next();
};

export default validationMiddleware;
