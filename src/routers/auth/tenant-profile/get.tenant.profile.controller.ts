import { Request, Response, NextFunction } from 'express';
import database from '../../../lib/config/prisma.client';
import { ResponseHandler } from '../../../lib/utils/response.handler';
import { HttpRes } from '../../../lib/constant/http.response';

export const GetTenantProfileController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res
        .status(HttpRes.status.UNAUTHORIZED)
        .json(ResponseHandler.error('Unauthorized', 'User not authenticated'));
    }

    // Find User by UId
    const user = await database.user.findUnique({
      where: { uid: userId },
      select: {
        id: true,
      },
    });

    if (!user) {
      return res
        .status(HttpRes.status.OK)
        .json(ResponseHandler.success('User not found', null));
    }

    const tenantProfile = await database.tenantProfile.findUnique({
      where: {
        user_id: user.id,
      },
    });

    if (!tenantProfile) {
      return res
        .status(HttpRes.status.OK)
        .json(ResponseHandler.success('Tenant profile not found', null));
    }

    return res
      .status(HttpRes.status.OK)
      .json(
        ResponseHandler.success(
          'Tenant profile retrieved successfully',
          tenantProfile,
        ),
      );
  } catch (error) {
    next(error);
  }
};
