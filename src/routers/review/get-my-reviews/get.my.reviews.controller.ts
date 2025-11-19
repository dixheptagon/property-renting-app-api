import { NextFunction, Request, Response } from 'express';
import database from '../../../lib/config/prisma.client';
import { CustomError } from '../../../lib/utils/custom.error';
import { HttpRes } from '../../../lib/constant/http.response';
import { ResponseHandler } from '../../../lib/utils/response.handler';

export const GetMyReviewsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      page = '1',
      limit = '10',
      orderBy = 'reviewCreatedAt',
      order = 'desc',
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
    const validOrderBy = ['reviewCreatedAt'];
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

    // Get completed bookings with reviews
    const bookingsWithReviews = await database.booking.findMany({
      where: {
        user_id: user.id,
        status: 'completed',
        review: {
          isNot: null,
        },
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            tenant: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                display_name: true,
              },
            },
          },
        },
        room: {
          select: {
            id: true,
            name: true,
          },
        },
        review: true,
      },
      orderBy: {
        review: {
          created_at: order as 'asc' | 'desc',
        },
      },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });

    // Get total count
    const totalCount = await database.booking.count({
      where: {
        user_id: user.id,
        status: 'completed',
        review: {
          isNot: null,
        },
      },
    });

    const totalPages = Math.ceil(totalCount / limitNum);

    // Format response data
    const reviewsData = bookingsWithReviews.map((booking: any) => ({
      booking_uid: booking.uid,
      status: booking.status,
      property: {
        id: booking.property.id,
        name: booking.property.title,
        room_type: booking.room.name,
        tenant: {
          id: booking.property.tenant.id,
          first_name: booking.property.tenant.first_name,
          last_name: booking.property.tenant.last_name,
          display_name: booking.property.tenant.display_name,
        },
      },
      review: booking.review
        ? {
            id: booking.review.id,
            rating: booking.review.rating,
            comment: booking.review.comment,
            reply: booking.review.reply,
            createdAt: booking.review.created_at,
            updatedAt: booking.review.updated_at,
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
