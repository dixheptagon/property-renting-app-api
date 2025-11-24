import { GetPropertyListService } from './get.property.list.service.js';
import { CustomError } from '../../../lib/utils/custom.error.js';
import { HttpRes } from '../../../lib/constant/http.response.js';
import { ResponseHandler } from '../../../lib/utils/response.handler.js';
import database from '../../../lib/config/prisma.client.js';
export const GetPropertyListByTenantController = async (req, res, next) => {
    try {
        // Get user from verifyToken middleware
        const userUid = req.user?.uid;
        if (!userUid) {
            throw new CustomError(HttpRes.status.UNAUTHORIZED, HttpRes.message.UNAUTHORIZED, 'User not authenticated');
        }
        // Find user by uid to get id
        const user = await database.user.findUnique({
            where: { uid: userUid },
            select: { id: true },
        });
        if (!user?.id) {
            throw new CustomError(HttpRes.status.UNAUTHORIZED, HttpRes.message.UNAUTHORIZED, 'User ID required');
        }
        const tenantId = user.id;
        // Parse query parameters
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
        const { status, category, sort_by = 'created_at', sort_dir = 'desc', } = req.query;
        // Validate status
        let statusFilter;
        if (status && typeof status === 'string') {
            const validStatuses = ['draft', 'active', 'deleted'];
            if (!validStatuses.includes(status.toLowerCase())) {
                throw new CustomError(HttpRes.status.BAD_REQUEST, HttpRes.message.BAD_REQUEST, 'Invalid status parameter. Valid values: draft, active, deleted');
            }
            statusFilter = status.toLowerCase();
        }
        // Validate category
        let categoryFilter;
        if (category && typeof category === 'string') {
            const validCategories = ['house', 'apartment', 'hotel', 'villa', 'room'];
            if (!validCategories.includes(category.toLowerCase())) {
                throw new CustomError(HttpRes.status.BAD_REQUEST, HttpRes.message.BAD_REQUEST, `Invalid category. Must be one of: ${validCategories.join(', ')}`);
            }
            categoryFilter = category.toLowerCase();
        }
        // Validate sort_by
        let sortBy;
        if (sort_by && typeof sort_by === 'string') {
            const validSortFields = [
                'created_at',
                'updated_at',
                'title',
                'base_price',
            ];
            if (!validSortFields.includes(sort_by)) {
                throw new CustomError(HttpRes.status.BAD_REQUEST, HttpRes.message.BAD_REQUEST, 'Invalid sort_by parameter. Valid values: created_at, updated_at, title, base_price');
            }
            sortBy = sort_by;
        }
        else {
            sortBy = 'created_at';
        }
        // Validate sort_dir
        let sortDir;
        if (sort_dir && typeof sort_dir === 'string') {
            if (!['asc', 'desc'].includes(sort_dir.toLowerCase())) {
                throw new CustomError(HttpRes.status.BAD_REQUEST, HttpRes.message.BAD_REQUEST, 'Invalid sort_dir parameter. Valid values: asc, desc');
            }
            sortDir = sort_dir.toLowerCase();
        }
        else {
            sortDir = 'desc';
        }
        // Call service
        const result = await GetPropertyListService.getPropertyListByTenant({
            tenantId,
            status: statusFilter,
            category: categoryFilter,
            page,
            limit,
            sortBy,
            sortDir,
        });
        res
            .status(HttpRes.status.OK)
            .json(ResponseHandler.success('Property list retrieved successfully', result));
    }
    catch (error) {
        next(error);
    }
};
