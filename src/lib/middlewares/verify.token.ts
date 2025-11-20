import jwt from 'jsonwebtoken';
import env from '../../env';
import { NextFunction, Request, Response } from 'express';
import { CustomError } from '../utils/custom.error';
import { HttpRes } from '../constant/http.response';

// Define the structure of the JWT payload
interface JwtPayload {
  uid: string;
  email: string;
  role: string;
  // Add other fields as needed, e.g., iat, exp
}

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new CustomError(
        HttpRes.status.UNAUTHORIZED,
        HttpRes.message.UNAUTHORIZED,
        'Access token is required',
      );
    }

    const token = authHeader.substring(7);

    if (!token || token === 'null' || token === 'undefined') {
      throw new CustomError(
        HttpRes.status.UNAUTHORIZED,
        HttpRes.message.UNAUTHORIZED,
        'Access token is required',
      );
    }

    const decodedToken = jwt.verify(
      token!,
      env.JWT_ACCESS_SECRET!,
    ) as JwtPayload;

    req.user = decodedToken;
    next();
  } catch (error) {
    if (error instanceof Error) {
      throw new CustomError(
        HttpRes.status.UNAUTHORIZED,
        HttpRes.message.UNAUTHORIZED,
        error.message,
      );
    }

    next(error);
  }
};
