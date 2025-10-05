import { NextFunction, Response } from 'express';
import database from '../../../lib/config/prisma.client';
import { CustomError } from '../../../lib/utils/custom.error';
import { HttpRes } from '../../../lib/constant/http.response';
import { ResponseHandler } from '../../../lib/utils/response.handler';
import { AuthRequest } from '../../../lib/middlewares/dummy.verify.role';
import { CancelOrderByTenantSchema } from './cancel.order.validation';

export const CancelOrderByTenantController = async (
  req: AuthRequest,
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
    const { cancellationReason } = await CancelOrderByTenantSchema.validate(
      req.body,
      {
        abortEarly: false,
      },
    );

    // Check authentication
    const user = req.user;
    if (!user || !user.id) {
      throw new CustomError(
        HttpRes.status.UNAUTHORIZED,
        HttpRes.message.UNAUTHORIZED,
        'Authentication required',
      );
    }

    if (user.role !== 'tenant') {
      throw new CustomError(
        HttpRes.status.FORBIDDEN,
        HttpRes.message.FORBIDDEN,
        'Access denied. Tenant role required.',
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
        cancellation_reason: cancellationReason,
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
