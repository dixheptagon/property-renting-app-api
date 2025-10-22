import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import env from '../../../env';
import { RegisterSchema } from './register.validation';
import { UserRole } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import database from '../../../lib/config/prisma.client';
import { CustomError } from '../../../lib/utils/custom.error';
import { HttpRes } from '../../../lib/constant/http.response';
import { ResponseHandler } from '../../../lib/utils/response.handler';

export const RegisterController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Validate request body
    const {
      first_name,
      last_name,
      email,
      password,
      role = 'guest',
    } = await RegisterSchema.validate(req.body, {
      abortEarly: false,
    });

    // Check if user already exists
    const existingUser = await database.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new CustomError(
        HttpRes.status.CONFLICT,
        HttpRes.message.CONFLICT,
        'User already registered. Please login.',
      );
    }

    // Check if email was verified
    const emailVerification = await database.emailVerification.findFirst({
      where: {
        email,
        is_used: true,
      },
      orderBy: { created_at: 'desc' },
    });

    if (!emailVerification) {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        'Email not verified. Please verify your email first.',
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const transaction = await database.$transaction(async (tx) => {
      // Generate UID
      const uid = crypto.randomUUID();

      // Create new user
      const user = await tx.user.create({
        data: {
          uid,
          first_name,
          last_name,
          email,
          password: hashedPassword,
          role: role as UserRole,
          is_verified: true, // Already verified via email
        },
        select: {
          id: true,
          uid: true,
          first_name: true,
          last_name: true,
          email: true,
          role: true,
          is_verified: true,
        },
      });

      // Clean up used verification records
      await tx.emailVerification.deleteMany({
        where: { email },
      });

      // Create JWT token
      const accessToken = jwt.sign(
        { uid: user.uid, email: user.email, role: user.role },
        env.JWT_ACCESS_SECRET,
        { expiresIn: '15m' },
      );

      // Create refresh token
      const refreshToken = jwt.sign(
        { uid: user.uid, email: user.email, role: user.role },
        env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' },
      );

      await tx.user.update({
        where: { id: user.id },
        data: { refresh_token: refreshToken },
      });

      return { user, accessToken, refreshToken };
    });

    // Send refresh token via HTTP-Only cookie
    res.cookie('refresh_token', transaction.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days EXP
    });

    const fullname = `${transaction.user.first_name} ${transaction.user.last_name}`;

    return res
      .status(HttpRes.status.CREATED)
      .json(
        ResponseHandler.success(
          `${HttpRes.message.CREATED} : Registration completed successfully! Welcome ${fullname}`,
          { user: transaction.user, access_token: transaction.accessToken },
        ),
      );
  } catch (error) {
    next(error);
  }
};
