import { NextFunction, Response } from 'express';
import { GetOrderListService } from './get.order.list.service';
import { CustomError } from '../../../lib/utils/custom.error';
import { HttpRes } from '../../../lib/constant/http.response';
import { ResponseHandler } from '../../../lib/utils/response.handler';
import { AuthRequest } from '../../../lib/middlewares/dummy.verify.role';

export const GetOrderListByTenantController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Assuming authentication middleware sets req.user
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

    const tenantId = user.id;

    // Parse query parameters
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));

    const {
      status,
      date_from,
      date_to,
      sort_by = 'created_at',
      sort_dir = 'desc',
    } = req.query;

    // Validate status
    let statusFilter: string | undefined;
    if (status && typeof status === 'string') {
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
          'Invalid status parameter',
        );
      }
      statusFilter = status.toLowerCase();
    }

    // Validate dates
    let dateFrom: Date | undefined;
    let dateTo: Date | undefined;

    if (date_from && typeof date_from === 'string') {
      dateFrom = new Date(date_from);
      if (isNaN(dateFrom.getTime())) {
        throw new CustomError(
          HttpRes.status.BAD_REQUEST,
          HttpRes.message.BAD_REQUEST,
          'Invalid date_from format. Use YYYY-MM-DD',
        );
      }
    }

    if (date_to && typeof date_to === 'string') {
      dateTo = new Date(date_to);
      if (isNaN(dateTo.getTime())) {
        throw new CustomError(
          HttpRes.status.BAD_REQUEST,
          HttpRes.message.BAD_REQUEST,
          'Invalid date_to format. Use YYYY-MM-DD',
        );
      }
    }

    // Validate sort_by
    let sortBy: string;
    if (sort_by && typeof sort_by === 'string') {
      const validSortFields = ['created_at', 'check_in_date', 'total_price'];
      if (!validSortFields.includes(sort_by)) {
        throw new CustomError(
          HttpRes.status.BAD_REQUEST,
          HttpRes.message.BAD_REQUEST,
          'Invalid sort_by parameter. Valid values: created_at, check_in_date, total_price',
        );
      }
      sortBy = sort_by;
    } else {
      sortBy = 'created_at';
    }

    // Validate sort_dir
    let sortDir: string;
    if (sort_dir && typeof sort_dir === 'string') {
      if (!['asc', 'desc'].includes(sort_dir.toLowerCase())) {
        throw new CustomError(
          HttpRes.status.BAD_REQUEST,
          HttpRes.message.BAD_REQUEST,
          'Invalid sort_dir parameter. Valid values: asc, desc',
        );
      }
      sortDir = sort_dir.toLowerCase();
    } else {
      sortDir = 'desc';
    }

    // Call service
    const result = await GetOrderListService.getOrderListByTenant({
      tenantId,
      status: statusFilter,
      dateFrom,
      dateTo,
      page,
      limit,
      sortBy,
      sortDir,
    });

    res
      .status(HttpRes.status.OK)
      .json(
        ResponseHandler.success('Order list retrieved successfully', result),
      );
  } catch (error) {
    next(error);
  }
};
