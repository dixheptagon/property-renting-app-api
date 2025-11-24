import database from '../../../lib/config/prisma.client.js';
import { CustomError } from '../../../lib/utils/custom.error.js';
import { HttpRes } from '../../../lib/constant/http.response.js';
import { ResponseHandler } from '../../../lib/utils/response.handler.js';
import { GetSalesReportService } from './get.sales.report.service.js';
export const GetSalesReportController = async (req, res, next) => {
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
        const { propertyUId, startDate, endDate } = req.query;
        // Validate and set dateRange
        let start;
        let end;
        if (startDate && endDate) {
            start = new Date(startDate);
            end = new Date(endDate);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                throw new CustomError(HttpRes.status.BAD_REQUEST, HttpRes.message.BAD_REQUEST, 'Invalid date format. Use YYYY-MM-DD');
            }
            if (start >= end) {
                throw new CustomError(HttpRes.status.BAD_REQUEST, HttpRes.message.BAD_REQUEST, 'startDate must be before endDate');
            }
            // Check max 6 months
            const diffTime = end.getTime() - start.getTime();
            const diffDays = diffTime / (1000 * 3600 * 24);
            if (diffDays > 186) {
                // 6 months approx
                throw new CustomError(HttpRes.status.BAD_REQUEST, HttpRes.message.BAD_REQUEST, 'Date range cannot exceed 6 months');
            }
        }
        else {
            // Default to 1 month
            end = new Date();
            start = new Date();
            start.setMonth(start.getMonth() - 1);
        }
        // Get propertyId
        let propertyId;
        if (propertyUId && typeof propertyUId === 'string') {
            const property = await database.property.findUnique({
                where: { uid: propertyUId },
                select: { id: true, user_id: true },
            });
            if (!property) {
                throw new CustomError(HttpRes.status.NOT_FOUND, HttpRes.message.NOT_FOUND, 'Property not found');
            }
            if (property.user_id !== tenantId) {
                throw new CustomError(HttpRes.status.FORBIDDEN, HttpRes.message.FORBIDDEN, 'Property does not belong to this tenant');
            }
            propertyId = property.id;
        }
        else {
            // Get first property of tenant
            const property = await database.property.findFirst({
                where: { user_id: tenantId, status: 'active' },
                select: { id: true },
                orderBy: { created_at: 'asc' },
            });
            if (!property) {
                throw new CustomError(HttpRes.status.NOT_FOUND, HttpRes.message.NOT_FOUND, 'No active properties found for this tenant');
            }
            propertyId = property.id;
        }
        // Call service to get sales report
        const result = await GetSalesReportService.getSalesReport({
            tenantId,
            propertyId,
            startDate: start,
            endDate: end,
        });
        res
            .status(HttpRes.status.OK)
            .json(ResponseHandler.success('Sales report retrieved successfully', result));
    }
    catch (error) {
        next(error);
    }
};
