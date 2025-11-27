import { NextFunction, Request, Response } from 'express';
import { getPropertyDetails } from './property.detail.service.js';
import { CustomError } from '../../../lib/utils/custom.error.js';
import { HttpRes } from '../../../lib/constant/http.response.js';
import { ResponseHandler } from '../../../lib/utils/response.handler.js';

export const getPropertyDetailsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Extract and validate parameters
    const { uid } = req.params;

    // Validate uid
    if (!uid || typeof uid !== 'string') {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        'Property uid is required and must be a string',
      );
    }

    // Call service
    const propertyDetails = await getPropertyDetails(uid);

    res
      .status(HttpRes.status.OK)
      .json(
        ResponseHandler.success(
          'Property details retrieved successfully',
          propertyDetails,
        ),
      );
  } catch (error) {
    if (error instanceof Error && error.message === HttpRes.message.NOT_FOUND) {
      return next(
        new CustomError(
          HttpRes.status.NOT_FOUND,
          HttpRes.message.NOT_FOUND,
          'Property not found',
        ),
      );
    }

    // For other errors, pass to global error handler
    next(error);
  }
};
