import { NextFunction, Request, Response } from 'express';
import { CreateReviewSchema } from './create.review.validation';
import database from '../../../lib/config/prisma.client';
import { CustomError } from '../../../lib/utils/custom.error';
import { HttpRes } from '../../../lib/constant/http.response';
import { ResponseHandler } from '../../../lib/utils/response.handler';

export const CreateReviewController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { booking_uid } = req.params;
    const { comment, rating } = await CreateReviewSchema.validate(req.body, {
      abortEarly: false,
    });

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

    // Find booking by uid
    const booking = await database.booking.findUnique({
      where: { uid: booking_uid },
      include: {
        property: {
          select: {
            id: true,
          },
        },
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
    if (booking.user_id !== user.id) {
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
        user_id: user.id,
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

    // Prepare response data
    const responseData = {
      booking_uid: booking.uid,
      status: booking.status,
      review: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        reply: null,
        createdAt: review.created_at,
        updatedAt: review.updated_at,
      },
    };

    res
      .status(HttpRes.status.CREATED)
      .json(
        ResponseHandler.success('Review created successfully', responseData),
      );
  } catch (error) {
    next(error);
  }
};
