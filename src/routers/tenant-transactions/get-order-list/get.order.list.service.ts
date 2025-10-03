import database from '../../../lib/config/prisma.client';
import { CustomError } from '../../../lib/utils/custom.error';
import { HttpRes } from '../../../lib/constant/http.response';

interface GetOrderListParams {
  tenantId: number;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page: number;
  limit: number;
  sortBy?: string;
  sortDir?: string;
}

interface OrderListResponse {
  data: {
    orderId: string;
    status: string;
    check_in_date: Date;
    check_out_date: Date;
    total_price: number;
    property: {
      name: string;
      address: string;
      city: string;
    };
    room: {
      name: string;
      description: string;
    };
    user: {
      name: string;
      email: string;
    };
  }[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export class GetOrderListService {
  static async getOrderListByTenant(
    params: GetOrderListParams,
  ): Promise<OrderListResponse> {
    const {
      tenantId,
      status,
      dateFrom,
      dateTo,
      page,
      limit,
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

    // Status filtering
    if (status) {
      const validStatuses = [
        'pending_payment',
        'processing',
        'confirmed',
        'cancelled',
        'completed',
      ];
      if (!validStatuses.includes(status.toLowerCase())) {
        throw new CustomError(
          HttpRes.status.BAD_REQUEST,
          HttpRes.message.BAD_REQUEST,
          'Invalid status value',
        );
      }
      where.status = status.toLowerCase();
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
