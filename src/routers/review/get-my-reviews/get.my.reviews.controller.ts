import { NextFunction, Response } from 'express';
import database from '../../../lib/config/prisma.client';
import { CustomError } from '../../../lib/utils/custom.error';
import { HttpRes } from '../../../lib/constant/http.response';
import { ResponseHandler } from '../../../lib/utils/response.handler';
import { AuthRequest } from '../../../lib/middlewares/dummy.verify.role';

export const GetMyReviewsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      page = '1',
      limit = '10',
      orderBy = 'createdAt',
      order = 'desc',
    } = req.query;

    // Validate user authentication
    if (!req.user) {
      throw new CustomError(
        HttpRes.status.UNAUTHORIZED,
        HttpRes.message.UNAUTHORIZED,
        'Authentication required',
      );
    }

    const userIdNum = req.user.id;

    // Check if user is a guest
    if (req.user.role !== 'guest') {
      throw new CustomError(
        HttpRes.status.FORBIDDEN,
        HttpRes.message.FORBIDDEN,
        'Only guests can view their reviews',
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
    const validOrderBy = ['createdAt', 'check_in_date'];
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

    // Get completed bookings with reviews (left join)
    const bookingsWithReviews = await database.booking.findMany({
      where: {
        user_id: userIdNum,
        status: 'completed',
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
          },
        },
        review: true,
      },
      orderBy: {
        [orderBy === 'createdAt' ? 'created_at' : 'check_in_date']: order,
      },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });

    // Get total count
    const totalCount = await database.booking.count({
      where: {
        user_id: userIdNum,
        status: 'completed',
      },
    });

    const totalPages = Math.ceil(totalCount / limitNum);

    // Format response data
    const reviewsData = bookingsWithReviews.map((booking) => ({
      booking_uid: booking.uid,
      status: booking.status,
      property: {
        id: booking.property.id,
        name: booking.property.title,
      },
      review: booking.review
        ? {
            id: booking.review.id,
            rating: booking.review.rating,
            comment: booking.review.comment,
            reply: booking.review.reply,
            createdAt: booking.review.created_at,
          }
        : null,
    }));

    const responseData = {
      reviews: reviewsData,
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
        ResponseHandler.success(
          'My reviews retrieved successfully',
          responseData,
        ),
      );
  } catch (error) {
    next(error);
  }
};
