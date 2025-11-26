import { NextFunction, Request, Response } from 'express';
import database from '../../../lib/config/prisma.client.js';
import { CustomError } from '../../../lib/utils/custom.error.js';
import { HttpRes } from '../../../lib/constant/http.response.js';
import { ResponseHandler } from '../../../lib/utils/response.handler.js';
import { CancelOrderByTenantSchema } from './cancel.order.validation.js';

export const CancelOrderByTenantController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get order ID from URL params
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

    // Validate request body
    const { cancellation_reason } = await CancelOrderByTenantSchema.validate(
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

    // Find booking with property details
    const booking = await database.booking.findUnique({
      where: { uid: orderId },
      include: {
        property: true,
      },
    });

    if (!booking) {
      throw new CustomError(
        HttpRes.status.NOT_FOUND,
        HttpRes.message.NOT_FOUND,
        'Booking not found',
      );
    }

    // Check if tenant owns the property
    if (booking.property.user_id !== user.id) {
      throw new CustomError(
        HttpRes.status.FORBIDDEN,
        HttpRes.message.FORBIDDEN,
        'Access denied. You can only cancel orders for your own properties.',
      );
    }

    // Check if booking is in pending_payment status
    if (booking.status !== 'pending_payment') {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        `Cannot cancel booking. Current status: ${booking.status}. Only pending_payment bookings can be cancelled by tenant.`,
      );
    }

    // Update booking status to cancelled and store cancellation reason
    const updatedBooking = await database.booking.update({
      where: { uid: orderId },
      data: {
        status: 'cancelled',
        cancellation_reason: cancellation_reason,
      },
    });

    res.status(HttpRes.status.OK).json(
      ResponseHandler.success('Booking cancelled successfully by tenant.', {
        booking_id: updatedBooking.id,
        order_uid: updatedBooking.uid,
        status: updatedBooking.status,
        cancellation_reason: updatedBooking.cancellation_reason,
      }),
    );
  } catch (error) {
    next(error);
  }
};
