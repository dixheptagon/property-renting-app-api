import { NextFunction, Response } from 'express';
import { ReplyReviewSchema } from './reply.review.validation';
import database from '../../../lib/config/prisma.client';
import { CustomError } from '../../../lib/utils/custom.error';
import { HttpRes } from '../../../lib/constant/http.response';
import { ResponseHandler } from '../../../lib/utils/response.handler';
import { AuthRequest } from '../../../lib/middlewares/dummy.verify.role';

export const ReplyReviewController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { booking_uid } = req.params;
    const { reply_comment } = await ReplyReviewSchema.validate(req.body, {
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

    // Check if user is a tenant
    if (req.user.role !== 'tenant') {
      throw new CustomError(
        HttpRes.status.FORBIDDEN,
        HttpRes.message.FORBIDDEN,
        'Only tenants can reply to reviews',
      );
    }

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

    // Check if review exists
    if (!booking.review) {
      throw new CustomError(
        HttpRes.status.NOT_FOUND,
        HttpRes.message.NOT_FOUND,
        'Review not found for this booking',
      );
    }

    // Check if tenant owns the property
    if (booking.property.user_id !== userIdNum) {
      throw new CustomError(
        HttpRes.status.FORBIDDEN,
        HttpRes.message.FORBIDDEN,
        'You can only reply to reviews for properties you own',
      );
    }

    // Check if reply already exists
    if (booking.review.reply) {
      throw new CustomError(
        HttpRes.status.CONFLICT,
        HttpRes.message.CONFLICT,
        'Reply already exists for this review',
      );
    }

    // Update review with reply
    const updatedReview = await database.review.update({
      where: { id: booking.review.id },
      data: {
        reply: reply_comment,
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
          },
        },
        property: {
          select: {
            title: true,
          },
        },
      },
    });

    // Log reply creation
    console.log(
      `Reply added to review ${booking.review.id} for booking ${booking_uid} by tenant ${userIdNum}`,
    );

    res
      .status(HttpRes.status.OK)
      .json(
        ResponseHandler.success(
          'Reply added to review successfully',
          updatedReview,
        ),
      );
  } catch (error) {
    next(error);
  }
};
