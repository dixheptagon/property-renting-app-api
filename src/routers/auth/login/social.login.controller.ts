import jwt from 'jsonwebtoken';
import env from '../../../env';
import { NextFunction, Request, Response } from 'express';
import database from '../../../lib/config/prisma.client';
import { CustomError } from '../../../lib/utils/custom.error';
import { HttpRes } from '../../../lib/constant/http.response';
import { ResponseHandler } from '../../../lib/utils/response.handler';
import admin from '../../../lib/config/firebase.admin';
import { SocialLoginSchema } from './social.login.validation';

export const SocialLoginController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { idToken } = await SocialLoginSchema.validate(req.body, {
      abortEarly: false,
    });

    // Verify the idToken with Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Extract required fields
    const { uid, email, name, picture } = decodedToken;

    if (!uid || !email) {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        'Invalid token: missing uid or email',
      );
    }

    // Split name into first name and last name
    const names = name.split(' ');
    const firstName = names[0];
    const lastName = names.slice(1).join(' ');

    // Check if user exists by uid
    let user = await database.user.findUnique({
      where: { uid },
    });

    if (!user) {
      // Create new user
      user = await database.user.create({
        data: {
          uid,
          email,
          first_name: firstName,
          last_name: lastName,
          is_verified: true,
          image: picture,
          role: 'guest',
        },
      });

      // Create UserProvider entry
      await database.userProvider.create({
        data: {
          user_id: user.id,
          provider: 'google',
          provider_user_id: uid,
        },
      });
    }

    // Generate access token
    const accessToken = jwt.sign(
      { uid: user.uid, email: user.email, role: user.role },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' },
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { uid: user.uid, email: user.email, role: user.role },
      env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' },
    );

    // Store refresh token in database
    await database.user.update({
      where: { id: user.id },
      data: { refresh_token: refreshToken },
    });

    // Set refresh token in HTTP-only cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Prepare user response data
    const { password: _, refresh_token, ...userData } = user;

    return res.status(HttpRes.status.OK).json(
      ResponseHandler.success('Social login successful', {
        access_token: accessToken,
        user: userData,
      }),
    );
  } catch (error) {
    if (error instanceof CustomError) {
      next(error);
    } else {
      next(
        new CustomError(
          HttpRes.status.INTERNAL_SERVER_ERROR,
          HttpRes.message.INTERNAL_SERVER_ERROR,
          'An error occurred during social login',
        ),
      );
    }
  }
};
