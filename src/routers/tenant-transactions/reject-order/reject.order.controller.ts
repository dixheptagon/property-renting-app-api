import { NextFunction, Request, Response } from 'express';
import database from '../../../lib/config/prisma.client';
import { CustomError } from '../../../lib/utils/custom.error';
import { HttpRes } from '../../../lib/constant/http.response';
import { ResponseHandler } from '../../../lib/utils/response.handler';
import { SendRejectionService } from './send.rejection.service';
import { RejectOrderSchema } from './reject.order.validation';

export const RejectOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Validate request body
    const { rejection_reason } = await RejectOrderSchema.validate(req.body, {
      abortEarly: false,
    });

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
        'Access denied. You can only reject orders for your own properties.',
      );
    }

    // Check if booking is in processing status
    if (booking.status !== 'processing') {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        `Cannot reject booking. Current status: ${booking.status}. Only processing bookings can be rejected.`,
      );
    }

    // payment deadline 2 Hours after booking
    const payment_deadline = new Date();
    payment_deadline.setHours(payment_deadline.getHours() + 2);

    // Update booking status back to pending_payment
    const updatedBooking = await database.booking.update({
      where: { uid: orderId },
      data: {
        status: 'pending_payment',
        payment_proof: null, // Clear the payment proof since it was rejected
        payment_deadline: payment_deadline,
        cancellation_reason: rejection_reason,
      },
    });

    // Send rejection email (don't fail the request if email fails)
    try {
      await SendRejectionService.sendBookingRejectionEmail(updatedBooking.id);
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
      // Continue with success response, email failure shouldn't block the rejection
    }

    res.status(HttpRes.status.OK).json(
      ResponseHandler.success(
        'Booking rejected successfully. Rejection email sent to guest. Guest has 2 hours to upload new payment proof.',
        {
          booking_id: updatedBooking.id,
          order_uid: updatedBooking.uid,
          status: updatedBooking.status,
          payment_deadline: updatedBooking.payment_deadline,
        },
      ),
    );
  } catch (error) {
    next(error);
  }
};
