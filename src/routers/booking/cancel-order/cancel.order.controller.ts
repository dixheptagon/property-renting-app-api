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

    if (
      !orderId ||
      typeof orderId !== 'string' ||
      !orderId.startsWith('ORDER-')
    ) {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        'Invalid order ID format. Expected format: ORDER-xxxxx',
      );
    }

    const { cancellation_reason } = await CancelOrderSchema.validate(req.body, {
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
      where: { uid: orderId, user_id: user.id },
    });

    if (!booking) {
      throw new CustomError(
        HttpRes.status.NOT_FOUND,
        HttpRes.message.NOT_FOUND,
        'Booking not found',
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
