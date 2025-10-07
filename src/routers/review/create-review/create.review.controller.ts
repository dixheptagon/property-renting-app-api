import { NextFunction, Response } from 'express';
import { CreateReviewSchema } from './create.review.validation';
import database from '../../../lib/config/prisma.client';
import { CustomError } from '../../../lib/utils/custom.error';
import { HttpRes } from '../../../lib/constant/http.response';
import { ResponseHandler } from '../../../lib/utils/response.handler';
import { AuthRequest } from '../../../lib/middlewares/dummy.verify.role';

export const CreateReviewController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { booking_uid } = req.params;
    const { comment, rating } = await CreateReviewSchema.validate(req.body, {
      abortEarly: false,
    });

    // Validate user authentication
    if (!req.user) {
      throw new CustomError(
        HttpRes.status.UNAUTHORIZED,
        HttpRes.message.UNAUTHORIZED,
        'Authentication required',
      );
    }

    const userIdNum = req.user.id;

    // Find booking by uid
    const booking = await database.booking.findUnique({
      where: { uid: booking_uid },
      include: {
        property: true,
        review: true,
      },
    });

    if (!booking) {
      throw new CustomError(
        HttpRes.status.NOT_FOUND,
        HttpRes.message.NOT_FOUND,
        'Booking not found',
      );
    }

    // Check if booking belongs to authenticated user
    if (booking.user_id !== userIdNum) {
      throw new CustomError(
        HttpRes.status.FORBIDDEN,
        HttpRes.message.FORBIDDEN,
        'You can only review your own bookings',
      );
    }

    // Check if booking status is completed
    if (booking.status !== 'completed') {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        'You can only review completed bookings',
      );
    }

    // Check if current date is after checkout date
    const currentDate = new Date();
    const checkoutDate = new Date(booking.check_out_date);
    if (currentDate <= checkoutDate) {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        'You can only review after the checkout date',
      );
    }

    // Check if review already exists for this booking
    if (booking.review) {
      throw new CustomError(
        HttpRes.status.CONFLICT,
        HttpRes.message.CONFLICT,
        'Review already exists for this booking',
      );
    }

    // Create review
    const review = await database.review.create({
      data: {
        booking_id: booking.id,
        user_id: userIdNum,
        property_id: booking.property_id,
        rating: rating,
        comment: comment,
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
    });

    res
      .status(HttpRes.status.CREATED)
      .json(ResponseHandler.success('Review created successfully', review));
  } catch (error) {
    next(error);
  }
};
