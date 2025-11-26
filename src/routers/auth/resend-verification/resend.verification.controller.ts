import { NextFunction, Request, Response } from 'express';
import { ResendVerificationSchema } from './resend.verification.validation.js';
import database from '../../../lib/config/prisma.client.js';
import { CustomError } from '../../../lib/utils/custom.error.js';
import { HttpRes } from '../../../lib/constant/http.response.js';
import { SendEmailVerificationController } from '../verification-email/send.email.controller.js';

export const ResendVerificationController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email } = await ResendVerificationSchema.validate(req.body, {
      abortEarly: false,
    });

    // Check if there's a recent verification request (rate limiting)
    const recentVerification = await database.emailVerification.findFirst({
      where: {
        email,
        updated_at: {
          gte: new Date(Date.now() - 1 * 60 * 1000), // 1 minute ago
        },
      },
    });

    if (recentVerification) {
      throw new CustomError(
        HttpRes.status.TOO_MANY_REQUESTS,
        HttpRes.message.TOO_MANY_REQUESTS,
        'Please wait 1 minute before requesting a new verification code',
      );
    }

    // Use the same logic as SendEmailVerificationController
    await SendEmailVerificationController(req, res, next);
  } catch (error) {
    next(error);
  }
};
