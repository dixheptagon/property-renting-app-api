import { CustomError } from '../../../lib/utils/custom.error.js';
import { HttpRes } from '../../../lib/constant/http.response.js';
import { ResponseHandler } from '../../../lib/utils/response.handler.js';
import { getReviewsByPropertyId } from './get.reviews.by.property.id.service.js';
export const GetReviewsByPropertyIdController = async (req, res, next) => {
    try {
        const { property_uid } = req.params;
        if (!property_uid) {
            throw new CustomError(HttpRes.status.BAD_REQUEST, HttpRes.message.BAD_REQUEST, 'Property UID is required');
        }
        const { page = 1, limit = 5, rating, sort_by = 'created_at', sort_dir = 'desc', search, } = req.query;
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
            sort_by: sort_by,
            sort_dir: sort_dir,
            search: search,
        };
        // Get reviews with statistics
        const result = await getReviewsByPropertyId(property_uid, serviceParams);
        res
            .status(HttpRes.status.OK)
            .json(ResponseHandler.success('Reviews retrieved successfully', result));
    }
    catch (error) {
        next(error);
    }
};
