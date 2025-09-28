import bcrypt from 'bcrypt';
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

      return { user };
    });

    const fullname = `${transaction.user.first_name} ${transaction.user.last_name}`;

    return res
      .status(HttpRes.status.CREATED)
      .json(
        ResponseHandler.success(
          `${HttpRes.message.CREATED} : Registration completed successfully! Welcome ${fullname}`,
          { ...transaction.user },
        ),
      );
  } catch (error) {
    next(error);
  }
};
