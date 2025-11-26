import { NextFunction, Request, Response } from 'express';
import database from '../../../lib/config/prisma.client.js';
import { CustomError } from '../../../lib/utils/custom.error.js';
import { HttpRes } from '../../../lib/constant/http.response.js';
import { ResponseHandler } from '../../../lib/utils/response.handler.js';
import { SendConfirmationService } from './send.confirmation.service.js';

export const ConfirmOrderController = async (
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
        'Access denied. You can only confirm orders for your own properties.',
      );
    }

    // Check if booking is in processing status
    if (booking.status !== 'processing') {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        `Cannot confirm booking. Current status: ${booking.status}. Only processing bookings can be confirmed.`,
      );
    }

    // Update booking status to confirmed
    const updatedBooking = await database.booking.update({
      where: { uid: orderId },
      data: {
        status: 'confirmed',
        cancellation_reason: null,
      },
    });

    // Send confirmation email (don't fail the request if email fails)
    try {
      await SendConfirmationService.sendBookingConfirmationEmail(
        updatedBooking.id,
      );
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Continue with success response, email failure shouldn't block the confirmation
    }

    res.status(HttpRes.status.OK).json(
      ResponseHandler.success(
        'Booking confirmed successfully. Confirmation email sent to guest.',
        {
          booking_id: updatedBooking.id,
          order_uid: updatedBooking.uid,
          status: updatedBooking.status,
          confirmed_at: updatedBooking.paid_at,
        },
      ),
    );
  } catch (error) {
    next(error);
  }
};
