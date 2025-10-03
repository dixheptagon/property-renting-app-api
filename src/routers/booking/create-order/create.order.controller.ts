import { NextFunction, Request, Response } from 'express';
import { CreateOrderSchema } from './create.order.validation';
import database from '../../../lib/config/prisma.client';
import { CustomError } from '../../../lib/utils/custom.error';
import { HttpRes } from '../../../lib/constant/http.response';
import GetTotalPriceOrder from '../utils/get.total.price.order';
import snap from '../../../lib/config/midtrans.client';
import { ResponseHandler } from '../../../lib/utils/response.handler';

export const CreateOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Validate Request Body
    const {
      user_id,
      room_id,
      property_id,
      check_in_date,
      check_out_date,
      fullname,
      email,
      phone_number,
    } = await CreateOrderSchema.validate(req.body, { abortEarly: false });

    // Checking room availibility
    const room = await database.room.findUnique({
      where: { id: room_id },
    });

    if (!room) {
      throw new CustomError(
        HttpRes.status.NOT_FOUND,
        HttpRes.message.NOT_FOUND,
        'Room not found',
      );
    }

    const overlappingBookings = await database.booking.count({
      where: {
        room_id,
        check_in_date: {
          lte: check_out_date,
        },
        check_out_date: {
          gte: check_in_date,
        },
        status: {
          notIn: ['cancelled', 'completed'],
        },
      },
    });

    if (overlappingBookings >= room.total_units) {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        'Room is fully booked on the selected dates',
      );
    }

    //1. Calculate total price based on room price and peak season rate
    const total_price = await GetTotalPriceOrder(
      room_id,
      check_in_date,
      check_out_date,
    );

    // START TRANSACTIONS
    const uid = 'ORDER-' + crypto.randomUUID();

    // payment deadline 2 Hours after booking
    const payment_deadline = new Date();
    payment_deadline.setHours(payment_deadline.getHours() + 2);

    //2. Create Booking Order in database
    const order = await database.booking.create({
      data: {
        uid,
        user_id,
        room_id,
        property_id,

        check_in_date,
        check_out_date,

        fullname,
        email,
        phone_number,

        total_price,
        status: 'pending_payment',
        payment_deadline,
      },
    });

    // Separate Fullname to First and Last Name
    const [firstName, lastName] = fullname.split(' ');

    // 3. Preparing Send Data : Make Parameter for Midtrans Transaction
    const transactionDetails = {
      transaction_details: {
        order_id: uid,
        gross_amount: total_price,
      },
      customer_details: {
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone_number,
      },
      enabled_payments: [
        'credit_card',
        'cimb_clicks',
        'bca_klikbca',
        'bca_klikpay',
        'bri_epay',
        'bca_va',
        'bni_va',
        'bri_va',
        'other_va',
        'gopay',
        'indomaret',
        'other_qris',
      ],
      expiry: {
        unit: 'hours',
        duration: 2,
      },
    };

    // 4. Create and Get Token from Midtrans
    const transactionToken = await snap.createTransaction(transactionDetails);

    // 5. update booking with midtrans token
    await database.booking.update({
      where: { id: order.id },
      data: { transaction_id: transactionToken.token },
    });

    // 6. Send Response
    res
      .status(HttpRes.status.CREATED)
      .json(
        ResponseHandler.success(
          `${HttpRes.message.CREATED} : Order created successfully`,
          { order, transaction_token: transactionToken },
        ),
      );
  } catch (error) {
    next(error);
  }
};
