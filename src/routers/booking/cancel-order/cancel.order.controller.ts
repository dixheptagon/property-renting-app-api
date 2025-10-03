import { NextFunction, Request, Response } from 'express';
import database from '../../../lib/config/prisma.client';
import { CustomError } from '../../../lib/utils/custom.error';
import { HttpRes } from '../../../lib/constant/http.response';
import { ResponseHandler } from '../../../lib/utils/response.handler';
import { CancelOrderSchema } from './cancel.order.validation';

export const CancelOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { orderId } = req.params;

    const { user_id } = req.query; // Assuming user_id passed as query param for auth

    const { cancellation_reason } = await CancelOrderSchema.validate(req.body, {
      abortEarly: false,
    });

    if (!user_id || typeof user_id !== 'string') {
      throw new CustomError(
        HttpRes.status.UNAUTHORIZED,
        HttpRes.message.UNAUTHORIZED,
        'User ID required',
      );
    }

    const userIdNum = parseInt(user_id, 10);
    if (isNaN(userIdNum)) {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        'Invalid user ID',
      );
    }

    // Find booking by uid
    const booking = await database.booking.findUnique({
      where: { uid: orderId },
    });

    if (!booking) {
      throw new CustomError(
        HttpRes.status.NOT_FOUND,
        HttpRes.message.NOT_FOUND,
        'Booking not found',
      );
    }

    // Check authorization: owner only
    if (booking.user_id !== Number(user_id)) {
      throw new CustomError(
        HttpRes.status.FORBIDDEN,
        HttpRes.message.FORBIDDEN,
        'Access denied',
      );
    }

    // Check if booking status allows cancellation
    if (booking.status !== 'pending_payment') {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        'Cancellation not allowed. Booking must be in pending_payment status.',
      );
    }

    // Update booking status to cancelled
    const updatedBooking = await database.booking.update({
      where: { id: booking.id },
      data: { status: 'cancelled' },
    });

    // Return success response
    res.status(HttpRes.status.OK).json(
      ResponseHandler.success('Booking cancelled successfully', {
        id: updatedBooking.id,
        uid: updatedBooking.uid,
        status: updatedBooking.status,
        cancellation_reason,
      }),
    );
  } catch (error) {
    next(error);
  }
};
