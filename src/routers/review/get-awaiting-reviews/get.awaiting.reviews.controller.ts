import { NextFunction, Request, Response } from 'express';
import database from '../../../lib/config/prisma.client.js';
import { CustomError } from '../../../lib/utils/custom.error.js';
import { HttpRes } from '../../../lib/constant/http.response.js';
import { ResponseHandler } from '../../../lib/utils/response.handler.js';

export const GetAwaitingReviewsController = async (
  req: Request,
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

    // Get completed bookings without reviews
    const bookingsWithoutReviews = await database.booking.findMany({
      where: {
        user_id: user.id,
        status: 'completed',
        review: null,
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            images: {
              select: {
                id: true,
                url: true,
                is_main: true,
              },
            },
            rooms: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
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
        user_id: user.id,
        status: 'completed',
        review: null,
      },
    });

    const totalPages = Math.ceil(totalCount / limitNum);

    // Format response data
    const awaitingReviewsData = bookingsWithoutReviews.map((booking) => ({
      booking_uid: booking.uid,
      status: booking.status,
      check_in_date: booking.check_in_date,
      check_out_date: booking.check_out_date,
      total_price: booking.total_price,
      property: {
        id: booking.property.id,
        name: booking.property.title,
        room_types: booking.property.rooms.map((room) => room.name),
        main_image: booking.property.images.find((image) => image.is_main)?.url,
      },
    }));

    const responseData = {
      awaiting_reviews: awaitingReviewsData,
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
          'Awaiting reviews retrieved successfully',
          responseData,
        ),
      );
  } catch (error) {
    next(error);
  }
};
