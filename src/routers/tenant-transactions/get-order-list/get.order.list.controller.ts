import { NextFunction, Request, Response } from 'express';
import { GetOrderListService } from './get.order.list.service';
import { CustomError } from '../../../lib/utils/custom.error';
import { HttpRes } from '../../../lib/constant/http.response';
import { ResponseHandler } from '../../../lib/utils/response.handler';
import database from '../../../lib/config/prisma.client';

export const GetOrderListByTenantController = async (
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
      select: { id: true },
    });

    if (!user?.id) {
      throw new CustomError(
        HttpRes.status.UNAUTHORIZED,
        HttpRes.message.UNAUTHORIZED,
        'User ID required',
      );
    }

    const tenantId = user.id;

    // Parse query parameters
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

    const {
      'status[]': status,
      'category[]': category,
      date_from,
      date_to,
      sort_by = 'created_at',
      sort_dir = 'desc',
    } = req.query;

    console.log(req.query);

    // Validate status
    let statusFilter: string[] | undefined;
    if (status) {
      const validStatuses = [
        'pending_payment',
        'processing',
        'confirmed',
        'cancelled',
        'completed',
      ];
      if (Array.isArray(status)) {
        statusFilter = status.map((s: any) => s.toLowerCase());
        for (const s of statusFilter) {
          if (!validStatuses.includes(s)) {
            throw new CustomError(
              HttpRes.status.BAD_REQUEST,
              HttpRes.message.BAD_REQUEST,
              'Invalid status parameter',
            );
          }
        }
      } else if (typeof status === 'string') {
        if (!validStatuses.includes(status.toLowerCase())) {
          throw new CustomError(
            HttpRes.status.BAD_REQUEST,
            HttpRes.message.BAD_REQUEST,
            'Invalid status parameter',
          );
        }
        statusFilter = [status.toLowerCase()];
      }
    }

    // Validate category
    let categoryFilter: string[] | undefined;
    if (category) {
      const validCategories = ['house', 'apartment', 'hotel', 'villa', 'room'];
      if (Array.isArray(category)) {
        categoryFilter = category.map((c: any) => c.toLowerCase());
        for (const c of categoryFilter) {
          if (!validCategories.includes(c)) {
            throw new CustomError(
              HttpRes.status.BAD_REQUEST,
              HttpRes.message.BAD_REQUEST,
              'Invalid category parameter',
            );
          }
        }
      } else if (typeof category === 'string') {
        if (!validCategories.includes(category.toLowerCase())) {
          throw new CustomError(
            HttpRes.status.BAD_REQUEST,
            HttpRes.message.BAD_REQUEST,
            'Invalid category parameter',
          );
        }
        categoryFilter = [category.toLowerCase()];
      }
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
      category: categoryFilter,
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
