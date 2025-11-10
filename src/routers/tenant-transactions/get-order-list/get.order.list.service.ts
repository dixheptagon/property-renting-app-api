import database from '../../../lib/config/prisma.client';
import { CustomError } from '../../../lib/utils/custom.error';
import { HttpRes } from '../../../lib/constant/http.response';
import { GetOrderListParams, OrderListResponse } from './get.order.list.types';

export class GetOrderListService {
  static async getOrderListByTenant(
    params: GetOrderListParams,
  ): Promise<OrderListResponse> {
    const {
      tenantId,
      status,
      category,
      dateFrom,
      dateTo,
      page,
      limit = 10,
      sortBy = 'created_at',
      sortDir = 'desc',
    } = params;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      property: {
        user_id: tenantId, // Only bookings for properties owned by this tenant
      },
    };

    // Category filtering
    if (category && category.length > 0) {
      where.property.category = {
        in: category,
      };
    }

    // Status filtering
    if (status && status.length > 0) {
      where.status = {
        in: status,
      };
    }

    // Date filtering on check_in_date
    if (dateFrom || dateTo) {
      where.check_in_date = {};
      if (dateFrom) {
        where.check_in_date.gte = dateFrom;
      }
      if (dateTo) {
        where.check_in_date.lte = dateTo;
      }
    }

    // Sorting
    const orderBy: any = {};
    if (
      sortBy === 'created_at' ||
      sortBy === 'check_in_date' ||
      sortBy === 'total_price'
    ) {
      orderBy[sortBy] = sortDir === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.created_at = 'desc'; // default
    }

    // Get total count
    const total = await database.booking.count({ where });

    // Get bookings with joins
    const bookings = await database.booking.findMany({
      where,
      include: {
        property: {
          select: {
            title: true,
            address: true,
            city: true,
          },
        },
        room: {
          select: {
            name: true,
            description: true,
          },
        },
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    if (bookings.length === 0) {
      throw new CustomError(
        HttpRes.status.NOT_FOUND,
        HttpRes.message.NOT_FOUND,
        'No orders found matching the criteria',
      );
    }

    // Format response
    const data = bookings.map((booking) => ({
      orderId: booking.uid || `ORDER-${booking.id}`,
      status: booking.status,
      check_in_date: booking.check_in_date,
      check_out_date: booking.check_out_date,
      total_price: Number(booking.total_price),
      property: {
        name: booking.property.title,
        address: booking.property.address,
        city: booking.property.city,
      },
      room: {
        name: booking.room.name,
        description: booking.room.description,
      },
      user: {
        name: `${booking.user.first_name} ${booking.user.last_name || ''}`.trim(),
        email: booking.user.email,
      },
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }
}
