import database from '../../../lib/config/prisma.client.js';
import { CustomError } from '../../../lib/utils/custom.error.js';
import { HttpRes } from '../../../lib/constant/http.response.js';
import { ResponseHandler } from '../../../lib/utils/response.handler.js';
import { getReviewsByTenant } from './get.reviews.by.tenant.service.js';
export const GetReviewsByTenantController = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, rating, date_from, date_to, sort_by = 'created_at', sort_dir = 'desc', search, propertyId, } = req.query;
        // Get user from verifyToken middleware
        const userUid = req.user?.uid;
        if (!userUid) {
            throw new CustomError(HttpRes.status.UNAUTHORIZED, HttpRes.message.UNAUTHORIZED, 'User not authenticated');
        }
        // Get user by UID
        const user = await database.user.findUnique({
            where: { uid: userUid },
            select: { id: true },
        });
        if (!user?.id) {
            throw new CustomError(HttpRes.status.UNAUTHORIZED, HttpRes.message.UNAUTHORIZED, 'User ID required');
        }
        // Parse and validate pagination parameters
        const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
        const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;
        if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
            throw new CustomError(HttpRes.status.BAD_REQUEST, HttpRes.message.BAD_REQUEST, 'Invalid pagination parameters');
        }
        // Validate sort parameters
        const validSortBy = ['created_at', 'rating', 'updated_at'];
        const validSortDir = ['asc', 'desc'];
        if ((sort_by && !validSortBy.includes(sort_by)) ||
            (sort_dir && !validSortDir.includes(sort_dir))) {
            throw new CustomError(HttpRes.status.BAD_REQUEST, HttpRes.message.BAD_REQUEST, 'Invalid sort parameters');
        }
        // Prepare service parameters
        const serviceParams = {
            page: pageNum,
            limit: limitNum,
            rating: rating,
            date_from: date_from,
            date_to: date_to,
            sort_by: sort_by,
            sort_dir: sort_dir,
            search: search,
            propertyId: propertyId,
        };
        // Get reviews with statistics
        const result = await getReviewsByTenant(user.id, serviceParams);
        res
            .status(HttpRes.status.OK)
            .json(ResponseHandler.success('Reviews retrieved successfully', result));
    }
    catch (error) {
        next(error);
    }
};
