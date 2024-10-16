export {};

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: mongoose.Types.ObjectId;
      };
    }
    interface Response {
      sendResponse: <T>(
        statusCode: number,
        message: string,
        hasError: boolean,
        data?: T
      ) => void;
    }
  }
}
