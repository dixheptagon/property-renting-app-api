import { NextFunction, Request, Response } from 'express';
import database from '../../../lib/config/prisma.client';
import { CustomError } from '../../../lib/utils/custom.error';
import { HttpRes } from '../../../lib/constant/http.response';
import { ResponseHandler } from '../../../lib/utils/response.handler';

export const GetReviewsByPropertyController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { propertyId } = req.params;
    const {
      page = '1',
      limit = '10',
      orderBy = 'created_at',
      order = 'desc',
    } = req.query;

    const propertyIdNum = parseInt(propertyId, 10);
    if (isNaN(propertyIdNum)) {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        'Invalid property ID',
      );
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        'Invalid pagination parameters',
      );
    }

    // Validate orderBy and order parameters
    const validOrderBy = ['created_at', 'rating'];
    const validOrder = ['asc', 'desc'];

    if (
      !validOrderBy.includes(orderBy as string) ||
      !validOrder.includes(order as string)
    ) {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        'Invalid order parameters',
      );
    }

    // Check if property exists
    const property = await database.property.findUnique({
      where: { id: propertyIdNum },
    });

    if (!property) {
      throw new CustomError(
        HttpRes.status.NOT_FOUND,
        HttpRes.message.NOT_FOUND,
        'Property not found',
      );
    }

    // Build order object
    const orderObject: any = {};
    orderObject[orderBy as string] = order;

    // Get reviews with pagination
    const reviews = await database.review.findMany({
      where: {
        property_id: propertyIdNum,
        is_public: true,
      },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            display_name: true,
          },
        },
        booking: {
          select: {
            uid: true,
            check_in_date: true,
            check_out_date: true,
          },
        },
      },
      orderBy: orderObject,
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });

    // Get total count for pagination
    const totalCount = await database.review.count({
      where: {
        property_id: propertyIdNum,
        is_public: true,
      },
    });

    const totalPages = Math.ceil(totalCount / limitNum);

    const responseData = {
      reviews,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
      },
    };

    res
      .status(HttpRes.status.OK)
      .json(
        ResponseHandler.success('Reviews retrieved successfully', responseData),
      );
  } catch (error) {
    next(error);
  }
};
