import { NextFunction, Request, Response } from 'express';
import database from '../../../lib/config/prisma.client.js';
import { HttpRes } from '../../../lib/constant/http.response.js';
import { ResponseHandler } from '../../../lib/utils/response.handler.js';
import { CheckEmailSchema } from './check.email.validation.js';

export const CheckEmailController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email } = await CheckEmailSchema.validate(req.body, {
      abortEarly: false,
    });

    // Check if user already exists
    const existingUser = await database.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        is_verified: true,
        first_name: true,
        last_name: true,
      },
    });

    if (existingUser) {
      return res.status(HttpRes.status.OK).json(
        ResponseHandler.success(
          HttpRes.message.CONFLICT +
            ' Email already exists, Please login to continue.',
          {
            exists: true,
            email: email,
            canProceed: false,
          },
        ),
      );
    }

    // Email available for registration
    return res.status(HttpRes.status.OK).json(
      ResponseHandler.success(
        HttpRes.message.OK + ': Email available for registration.',
        {
          exists: false,
          email: email,
          canProceed: true,
        },
      ),
    );
  } catch (error) {
    next(error);
  }
};
