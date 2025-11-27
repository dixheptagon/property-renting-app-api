import { NextFunction, Request, Response } from 'express';
import database from '../../../lib/config/prisma.client.js';
import { CustomError } from '../../../lib/utils/custom.error.js';
import { HttpRes } from '../../../lib/constant/http.response.js';
import { ResponseHandler } from '../../../lib/utils/response.handler.js';

export const GetBookingController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { orderId } = req.params;

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
      include: {
        room: {
          include: {
            property: {
              include: {
                images: true,
                tenant: {
                  select: {
                    email: true,
                  },
                },
              },
            },
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
      payment_proof: booking.payment_proof,
      cancellation_reason: booking.cancellation_reason,
      transaction_id: booking.transaction_id,
      paid_at: booking.paid_at,
      room: {
        id: booking.room.id,
        name: booking.room.name,
        property: {
          id: booking.room.property.id,
          tenant_email: booking.room.property.tenant.email,
          title: booking.room.property.title,
          address: booking.room.property.address,
          city: booking.room.property.city,
          main_image: booking.room.property.images.find(
            (image) => image.is_main,
          )?.url,
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
