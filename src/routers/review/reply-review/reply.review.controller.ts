import { NextFunction, Request, Response } from 'express';
import { ReplyReviewSchema } from './reply.review.validation.js';
import database from '../../../lib/config/prisma.client.js';
import { CustomError } from '../../../lib/utils/custom.error.js';
import { HttpRes } from '../../../lib/constant/http.response.js';
import { ResponseHandler } from '../../../lib/utils/response.handler.js';

export const ReplyReviewController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { booking_uid, reply_comment } = await ReplyReviewSchema.validate(
      req.body,
      {
        abortEarly: false,
      },
    );

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
    if (booking.property.user_id !== user.id) {
      throw new CustomError(
        HttpRes.status.FORBIDDEN,
        HttpRes.message.FORBIDDEN,
        'You can only reply to reviews for properties you own',
      );
    }

    // Update review with reply
    const updatedReview = await database.review.update({
      where: { id: booking.review.id },
      data: {
        reply: reply_comment,
        updated_at: new Date(),
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

    res.status(HttpRes.status.OK).json(
      ResponseHandler.success('Reply added to review successfully', {
        id: updatedReview.id,
        reply_comment: updatedReview.reply,
      }),
    );
  } catch (error) {
    next(error);
  }
};
