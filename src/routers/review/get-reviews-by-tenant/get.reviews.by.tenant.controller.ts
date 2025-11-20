import { NextFunction, Request, Response } from 'express';
import database from '../../../lib/config/prisma.client';
import { CustomError } from '../../../lib/utils/custom.error';
import { HttpRes } from '../../../lib/constant/http.response';
import { ResponseHandler } from '../../../lib/utils/response.handler';
import { getReviewsByTenant } from './get.reviews.by.tenant.service';
import { GetReviewsByTenantParams } from './get.reviews.by.tenant.types';

export const GetReviewsByTenantController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      page = 1,
      limit = 10,
      rating,
      date_from,
      date_to,
      sort_by = 'created_at',
      sort_dir = 'desc',
      search,
      propertyId,
    } = req.query;

    // Get user from verifyToken middleware
    const userUid = req.user?.uid;

    if (!userUid) {
      throw new CustomError(
        HttpRes.status.UNAUTHORIZED,
        HttpRes.message.UNAUTHORIZED,
        'User not authenticated',
      );
    }

    // Get user by UID
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
    const serviceParams: GetReviewsByTenantParams = {
      page: pageNum,
      limit: limitNum,
      rating: rating as string | string[],
      date_from: date_from as string,
      date_to: date_to as string,
      sort_by: sort_by as string,
      sort_dir: sort_dir as string,
      search: search as string,
      propertyId: propertyId as string,
    };

    // Get reviews with statistics
    const result = await getReviewsByTenant(user.id, serviceParams);

    res
      .status(HttpRes.status.OK)
      .json(ResponseHandler.success('Reviews retrieved successfully', result));
  } catch (error) {
    next(error);
  }
};
