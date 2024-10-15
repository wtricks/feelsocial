export {};

declare global {
  namespace Express {
    interface Request {
      test: string;
    }
  }
}
