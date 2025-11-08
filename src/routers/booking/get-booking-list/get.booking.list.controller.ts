import { NextFunction, Request, Response } from 'express';
import database from '../../../lib/config/prisma.client';
import { CustomError } from '../../../lib/utils/custom.error';
import { HttpRes } from '../../../lib/constant/http.response';
import { ResponseHandler } from '../../../lib/utils/response.handler';
import { normalizeTimezone } from '../utils/normalized.date';

export const GetBookingListController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
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
    });

    if (!user) {
      throw new CustomError(
        HttpRes.status.UNAUTHORIZED,
        HttpRes.message.UNAUTHORIZED,
        'User not found',
      );
    }

    const userId = user.id;

    // Parse query parameters
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const {
      order_id,
      date_from,
      date_to,
      status,
      sort_by = 'created_at',
      sort_dir = 'desc',
    } = req.query;

    const where: any = {
      user_id: userId,
    };

    // Order ID filtering (partial search)
    if (order_id && typeof order_id === 'string') {
      where.uid = {
        contains: order_id,
        mode: 'insensitive',
      };
    }

    // Status filtering
    if (status && typeof status === 'string') {
      const validStatuses = ['pending_payment', 'processing', 'confirmed'];
      if (!validStatuses.includes(status.toLowerCase())) {
        throw new CustomError(
          HttpRes.status.BAD_REQUEST,
          HttpRes.message.BAD_REQUEST,
          'Invalid status',
        );
      }
      where.status = status.toLowerCase();
    }

    // Date filtering (on created_at)
    if (date_from || date_to) {
      where.created_at = {};
      if (date_from && typeof date_from === 'string') {
        const fromDate = new Date(date_from);
        if (isNaN(fromDate.getTime())) {
          throw new CustomError(
            HttpRes.status.BAD_REQUEST,
            HttpRes.message.BAD_REQUEST,
            'Invalid date_from format',
          );
        }
        where.created_at.gte = normalizeTimezone(fromDate);
      }
      if (date_to && typeof date_to === 'string') {
        const toDate = new Date(date_to);
        if (isNaN(toDate.getTime())) {
          throw new CustomError(
            HttpRes.status.BAD_REQUEST,
            HttpRes.message.BAD_REQUEST,
            'Invalid date_to format',
          );
        }
        where.created_at.lte = normalizeTimezone(toDate);
      }
    }

    // Sorting
    const orderBy: any = {};
    if (
      sort_by === 'created_at' ||
      sort_by === 'check_in_date' ||
      sort_by === 'total_price'
    ) {
      orderBy[sort_by] = sort_dir === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.created_at = 'desc'; // default
    }

    // Get total count
    const total = await database.booking.count({ where });

    // Get total completed count
    const totalCompleted = await database.booking.count({
      where: {
        user_id: userId,
        status: 'completed',
      },
    });

    // Get bookings
    const bookings = await database.booking.findMany({
      where,
      include: {
        room: {
          include: {
            property: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    // Format response
    const data = bookings.map((booking) => ({
      order_id: booking.uid,
      room: {
        name: booking.room.name,
        description: booking.room.description,
        property: {
          name: booking.room.property.title,
          address: booking.room.property.address,
          city: booking.room.property.city,
        },
      },
      status: booking.status,
      check_in_date: normalizeTimezone(booking.check_in_date),
      check_out_date: normalizeTimezone(booking.check_out_date),
      total_price: booking.total_price,
      created_at: normalizeTimezone(booking.created_at),
    }));

    const response = {
      data,
      total_completed: totalCompleted,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };

    res
      .status(HttpRes.status.OK)
      .json(
        ResponseHandler.success('Bookings retrieved successfully', response),
      );
  } catch (error) {
    next(error);
  }
};
