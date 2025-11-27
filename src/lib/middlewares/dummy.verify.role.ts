import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../utils/custom.error.js';
import { HttpRes } from '../constant/http.response.js';

export interface AuthRequest extends Request {
  user?: { id: number; email: string; role: string; uid: string };
}

export const dummyUserMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const userHeader = req.headers['x-user'];
  if (userHeader) {
    try {
      req.user = JSON.parse(userHeader as string);
    } catch (err) {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        'Invalid user header',
      );
    }
  }
  next();
};
