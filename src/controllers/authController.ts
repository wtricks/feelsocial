import { type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import User from 'models/User';

/**
 * Authenticates a user by checking the provided email and password
 * If the user is found and the password matches, a JWT token is generated for the user
 * @param req - The request object containing user input data
 * @param res - The response object to send back the token and user object
 */
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  const user = await User.findOne({ email });
  if (!user || !user.comparePassword(password)) {
    return res.sendResponse(401, 'Invalid credentials', true);
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!);
  res.sendResponse(200, 'Login successful', false, { token, user });
};

/**
 * Registers a new user
 * @param req - The request object containing user input data
 * @param res - The response object to send back the registration result
 *
 * If the email already exists, a 400 Bad Request response is sent back
 * Otherwise, a new user is created, a JWT token is generated, and a 200 OK response is sent back
 * with the newly created user and the token
 */
export const registerUser = async (req: Request, res: Response) => {
  const { username, email, password } = req.body as {
    username: string;
    email: string;
    password: string;
  };

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.sendResponse(400, 'Email already exists', true);
  }

  const user = await User.create({ username, email, password });
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!);

  res.sendResponse(200, 'Registration successful', false, {
    token,
    user,
  });
};

/**
 * Retrieves the currently logged-in user based on the user ID in the request
 * @param req - The request object containing user information
 * @param res - The response object to send back the user information
 */
export const getCurrentLoggedInUser = async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.id);
  res.sendResponse(200, 'User retrieved successfully', false, user);
};
