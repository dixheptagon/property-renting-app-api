import jwt from 'jsonwebtoken';
import env from '../../../env.js';
import { NextFunction, Request, Response } from 'express';
import database from '../../../lib/config/prisma.client.js';
import { CustomError } from '../../../lib/utils/custom.error.js';
import { HttpRes } from '../../../lib/constant/http.response.js';
import { ResponseHandler } from '../../../lib/utils/response.handler.js';

// Define the structure of the JWT payload
interface JwtPayload {
  uid: string;
  email: string;
  role: string;
}

export const RefreshTokenController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Read refresh token from HttpOnly cookie
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      throw new CustomError(
        HttpRes.status.UNAUTHORIZED,
        HttpRes.message.UNAUTHORIZED,
        'Refresh token is required',
      );
    }

    // Verify the refresh token
    let decodedToken: JwtPayload;
    try {
      decodedToken = jwt.verify(
        refreshToken,
        env.JWT_REFRESH_SECRET,
      ) as JwtPayload;
    } catch (error) {
      throw new CustomError(
        HttpRes.status.UNAUTHORIZED,
        HttpRes.message.UNAUTHORIZED,
        'Invalid or expired refresh token',
      );
    }

    // Find user by uid from payload
    const user = await database.user.findUnique({
      where: { uid: decodedToken.uid },
    });

    if (!user || user.refresh_token !== refreshToken) {
      throw new CustomError(
        HttpRes.status.UNAUTHORIZED,
        HttpRes.message.UNAUTHORIZED,
        'Invalid refresh token',
      );
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { uid: user.uid, email: user.email, role: user.role },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' },
    );

    // Generate new refresh token
    const newRefreshToken = jwt.sign(
      { uid: user.uid, email: user.email, role: user.role },
      env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' },
    );

    // Update refresh token in database
    await database.user.update({
      where: { id: user.id },
      data: { refresh_token: newRefreshToken },
    });

    // Send new refresh token via HTTP-Only cookie
    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Respond with the new access token
    return res.status(HttpRes.status.OK).json(
      ResponseHandler.success('Access token refreshed successfully', {
        access_token: newAccessToken,
      }),
    );
  } catch (error) {
    next(error);
  }
};
