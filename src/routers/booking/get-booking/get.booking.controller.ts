import { NextFunction, Request, Response } from 'express';
import database from '../../../lib/config/prisma.client';
import { CustomError } from '../../../lib/utils/custom.error';
import { HttpRes } from '../../../lib/constant/http.response';
import { ResponseHandler } from '../../../lib/utils/response.handler';

export const GetBookingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { orderId } = req.params;
    const { user_id } = req.query; // Assuming user_id passed as query param for auth

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
      include: {
        room: {
          include: {
            property: true,
          },
        },
        user: true,
      },
    });

    if (!booking) {
      throw new CustomError(
        HttpRes.status.NOT_FOUND,
        HttpRes.message.NOT_FOUND,
        'Booking not found',
      );
    }

    // Check authorization: owner or admin (assuming tenant role is admin)
    const user = await database.user.findUnique({
      where: { id: userIdNum },
    });

    if (!user) {
      throw new CustomError(
        HttpRes.status.UNAUTHORIZED,
        HttpRes.message.UNAUTHORIZED,
        'User not found',
      );
    }

    const isOwner = booking.user_id === userIdNum;
    const isAdmin = user.role === 'tenant'; // Assuming tenant is admin

    if (!isOwner && !isAdmin) {
      throw new CustomError(
        HttpRes.status.FORBIDDEN,
        'Forbidden',
        'Access denied',
      );
    }

    // Return booking details
    const responseData = {
      id: booking.id,
      uid: booking.uid,
      status: booking.status,
      check_in_date: booking.check_in_date,
      check_out_date: booking.check_out_date,
      total_price: booking.total_price,
      fullname: booking.fullname,
      email: booking.email,
      phone_number: booking.phone_number,
      payment_method: booking.payment_method,
      transaction_id: booking.transaction_id,
      paid_at: booking.paid_at,
      room: {
        id: booking.room.id,
        name: booking.room.name,
        property: {
          id: booking.room.property.id,
          title: booking.room.property.title,
          address: booking.room.property.address,
          city: booking.room.property.city,
        },
      },
    };

    res
      .status(HttpRes.status.OK)
      .json(
        ResponseHandler.success('Booking retrieved successfully', responseData),
      );
  } catch (error) {
    next(error);
  }
};
