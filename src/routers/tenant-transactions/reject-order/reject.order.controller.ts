import { NextFunction, Response } from 'express';
import database from '../../../lib/config/prisma.client';
import { CustomError } from '../../../lib/utils/custom.error';
import { HttpRes } from '../../../lib/constant/http.response';
import { ResponseHandler } from '../../../lib/utils/response.handler';
import { AuthRequest } from '../../../lib/middlewares/dummy.verify.role';
import { BookingEmailService } from '../utils/booking.email.service';

export const RejectOrderController = async (
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
      },
    });

    // Send rejection email (don't fail the request if email fails)
    try {
      await BookingEmailService.sendBookingRejectionEmail(updatedBooking.id);
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
