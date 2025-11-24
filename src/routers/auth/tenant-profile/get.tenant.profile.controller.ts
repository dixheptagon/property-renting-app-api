import { Request, Response, NextFunction } from 'express';
import database from '../../../lib/config/prisma.client.js';
import { ResponseHandler } from '../../../lib/utils/response.handler.js';
import { HttpRes } from '../../../lib/constant/http.response.js';

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
        role: true,
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

    // Response
    const response = {
      tenantProfile: {
        id: tenantProfile.id,
        user_id: tenantProfile.user_id,
        contact: tenantProfile.contact,
        address: tenantProfile.address,
        city: tenantProfile.city,
        country: tenantProfile.country,
        government_id_type: tenantProfile.government_id_type,
        government_id_path: tenantProfile.government_id_path,
        verified: tenantProfile.verified,
        created_at: tenantProfile.created_at,
        updated_at: tenantProfile.updated_at,
      },
      user: {
        id: user.id,
        role: user.role,
      },
    };

    return res
      .status(HttpRes.status.OK)
      .json(
        ResponseHandler.success(
          'Tenant profile retrieved successfully',
          response,
        ),
      );
  } catch (error) {
    next(error);
  }
};
