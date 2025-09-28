import { NextFunction, Request, Response } from 'express';
import { CustomError } from '../../../lib/utils/custom.error';
import { HttpRes } from '../../../lib/constant/http.response';
import { VerifyEmailSchema } from './verify.email.validation';
import database from '../../../lib/config/prisma.client';
import { ResponseHandler } from '../../../lib/utils/response.handler';

export const VerifyEmailController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, verification_code, verification_token } =
      await VerifyEmailSchema.validate(req.body, { abortEarly: false });

    // Find verification record
    let whereClause: {
      email: string;
      is_used: boolean;
      used_at: Date | null;
      verification_code?: string;
      verification_token?: string;
    } = { email, is_used: false, used_at: null };

    if (verification_code) {
      whereClause.verification_token = verification_code;
    } else {
      whereClause.verification_code = verification_token;
    }

    const emailVerification = await database.emailVerification.findFirst({
      where: whereClause,
    });

    if (!emailVerification) {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        'Invalid or expired verification code/verification token',
      );
    }

    // Check if expired
    if (
      !emailVerification.expires_at ||
      emailVerification.expires_at < new Date()
    ) {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        'Verification code has expired. Please request a new one.',
      );
    }

    // Mark as used
    await database.emailVerification.update({
      where: { id: emailVerification.id },
      data: { is_used: true, used_at: new Date() },
    });

    return res.status(HttpRes.status.OK).json(
      ResponseHandler.success(
        HttpRes.message.OK +
          ' : Email verified successfully. Please complete your registration.',
        {
          email: email,
          verified: true,
          canProceedToRegister: true,
        },
      ),
    );
  } catch (error) {
    next(error);
  }
};
