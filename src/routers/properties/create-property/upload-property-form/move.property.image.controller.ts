import { Request, Response, NextFunction } from 'express';
import { movePropertyImagesService } from './move.property.image.service';
import { ResponseHandler } from '../../../../lib/utils/response.handler';
import { CustomError } from '../../../../lib/utils/custom.error';
import { HttpRes } from '../../../../lib/constant/http.response';
import database from '../../../../lib/config/prisma.client';

export const movePropertyImagesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get propertyId from request params
    const { propertyId } = req.params;

    if (!propertyId || isNaN(Number(propertyId))) {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        'Valid propertyId is required',
      );
    }

    // Get tenant ID from middleware
    const tenantId = (req as any).user?.uid;

    if (!tenantId) {
      throw new CustomError(
        HttpRes.status.UNAUTHORIZED,
        HttpRes.message.UNAUTHORIZED,
        'Tenant not authenticated',
      );
    }

    // Find User by UId
    const user = await database.user.findUnique({
      where: { uid: tenantId },
    });

    // Verify that the property belongs to the tenant
    const property = await database.property.findFirst({
      where: {
        id: Number(propertyId),
        user_id: user?.id,
      },
    });

    if (!property) {
      throw new CustomError(
        HttpRes.status.NOT_FOUND,
        HttpRes.message.NOT_FOUND,
        'Property not found or does not belong to tenant',
      );
    }

    // Call service to move images
    const result = await movePropertyImagesService(Number(propertyId));

    // Send success response
    res
      .status(HttpRes.status.OK)
      .json(ResponseHandler.success(HttpRes.message.OK, result));
  } catch (error) {
    next(error);
  }
};
