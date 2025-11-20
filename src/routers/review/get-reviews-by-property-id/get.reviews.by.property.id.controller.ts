import { NextFunction, Request, Response } from 'express';
import database from '../../../lib/config/prisma.client';
import { CustomError } from '../../../lib/utils/custom.error';
import { HttpRes } from '../../../lib/constant/http.response';
import { ResponseHandler } from '../../../lib/utils/response.handler';
import { getReviewsByPropertyId } from './get.reviews.by.property.id.service';
import { GetReviewsByPropertyIdParams } from './get.reviews.by.property.id.types';

export const GetReviewsByPropertyIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { property_uid } = req.params;

    if (!property_uid) {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        'Property UID is required',
      );
    }

    const {
      page = 1,
      limit = 5,
      rating,
      sort_by = 'created_at',
      sort_dir = 'desc',
      search,
    } = req.query;

    // Parse and validate pagination parameters
    const pageNum =
      typeof page === 'string' ? parseInt(page, 10) : (page as number);
    const limitNum =
      typeof limit === 'string' ? parseInt(limit, 10) : (limit as number);

    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        'Invalid pagination parameters',
      );
    }

    // Validate sort parameters
    const validSortBy = ['created_at', 'rating', 'updated_at'];
    const validSortDir = ['asc', 'desc'];

    if (
      (sort_by && !validSortBy.includes(sort_by as string)) ||
      (sort_dir && !validSortDir.includes(sort_dir as string))
    ) {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        'Invalid sort parameters',
      );
    }

    // Prepare service parameters
    const serviceParams: GetReviewsByPropertyIdParams = {
      page: pageNum,
      limit: limitNum,
      rating: rating as string | string[],
      sort_by: sort_by as string,
      sort_dir: sort_dir as string,
      search: search as string,
    };

    // Get reviews with statistics
    const result = await getReviewsByPropertyId(property_uid, serviceParams);

    res
      .status(HttpRes.status.OK)
      .json(ResponseHandler.success('Reviews retrieved successfully', result));
  } catch (error) {
    next(error);
  }
};
