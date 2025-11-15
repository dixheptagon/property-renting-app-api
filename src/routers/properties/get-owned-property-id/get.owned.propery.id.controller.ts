import { NextFunction, Request, Response } from 'express';
import database from '../../../lib/config/prisma.client';
import { CustomError } from '../../../lib/utils/custom.error';
import { HttpRes } from '../../../lib/constant/http.response';
import { ResponseHandler } from '../../../lib/utils/response.handler';

export const getOwnedPropertyIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get user from verifyToken middleware
    const userUid = req.user?.uid;

    if (!userUid) {
      throw new CustomError(
        HttpRes.status.UNAUTHORIZED,
        HttpRes.message.UNAUTHORIZED,
        'User not authenticated',
      );
    }

    // Find user by uid to get id
    const user = await database.user.findUnique({
      where: { uid: userUid },
      select: { id: true },
    });

    if (!user?.id) {
      throw new CustomError(
        HttpRes.status.UNAUTHORIZED,
        HttpRes.message.UNAUTHORIZED,
        'User ID required',
      );
    }

    // Get owned properties - just id, uid, and title
    const properties = await database.property.findMany({
      where: {
        user_id: user.id,
      },
      select: {
        id: true,
        uid: true,
        title: true,
      },
      orderBy: {
        title: 'asc',
      },
    });

    res
      .status(HttpRes.status.OK)
      .json(
        ResponseHandler.success('Owned properties retrieved successfully', {
          properties,
        }),
      );
  } catch (error) {
    next(error);
  }
};
