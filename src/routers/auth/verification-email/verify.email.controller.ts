import { NextFunction, Request, Response } from 'express';
import { CustomError } from '../../../lib/utils/custom.error.js';
import { HttpRes } from '../../../lib/constant/http.response.js';
import {
  VerifyOtpSchema,
  VerifyTokenSchema,
} from './verify.email.validation.js';
import database from '../../../lib/config/prisma.client.js';
import { ResponseHandler } from '../../../lib/utils/response.handler.js';

export const VerifyEmailController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    let whereClause: any = { is_used: false, used_at: null };
    let email: string | undefined;

    // cek kalau ada token di query → link verification
    if (req.query.verification_token) {
      const { verification_token } = await VerifyTokenSchema.validate(
        req.query,
        { abortEarly: false },
      );
      whereClause.verification_token = verification_token;
    } else {
      // kalau OTP, ambil dari body
      const { email: bodyEmail, verification_code } =
        await VerifyOtpSchema.validate(req.body, { abortEarly: false });

      email = bodyEmail;
      whereClause.email = bodyEmail;
      whereClause.verification_code = verification_code;
    }

    const emailVerification = await database.emailVerification.findFirst({
      where: whereClause,
    });

    if (!emailVerification) {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        'Invalid or expired verification code/ verification token',
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
        'Email verified successfully. Please complete your registration.',
        {
          email: email ?? emailVerification.email, // if using OTP give email, if using link get email from database
          verified: true,
          canProceedToRegister: true,
        },
      ),
    );
  } catch (error) {
    next(error);
  }
};
