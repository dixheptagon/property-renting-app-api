"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetSalesReportController = void 0;
const prisma_client_1 = __importDefault(require("../../../lib/config/prisma.client"));
const custom_error_1 = require("../../../lib/utils/custom.error");
const http_response_1 = require("../../../lib/constant/http.response");
const response_handler_1 = require("../../../lib/utils/response.handler");
const get_sales_report_service_1 = require("./get.sales.report.service");
const GetSalesReportController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Get user from verifyToken middleware
        const userUid = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        if (!userUid) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.UNAUTHORIZED, http_response_1.HttpRes.message.UNAUTHORIZED, 'User not authenticated');
        }
        // Find user by uid to get id
        const user = yield prisma_client_1.default.user.findUnique({
            where: { uid: userUid },
            select: { id: true },
        });
        if (!(user === null || user === void 0 ? void 0 : user.id)) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.UNAUTHORIZED, http_response_1.HttpRes.message.UNAUTHORIZED, 'User ID required');
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
                throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Invalid date format. Use YYYY-MM-DD');
            }
            if (start >= end) {
                throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'startDate must be before endDate');
            }
            // Check max 6 months
            const diffTime = end.getTime() - start.getTime();
            const diffDays = diffTime / (1000 * 3600 * 24);
            if (diffDays > 186) {
                // 6 months approx
                throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Date range cannot exceed 6 months');
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
            const property = yield prisma_client_1.default.property.findUnique({
                where: { uid: propertyUId },
                select: { id: true, user_id: true },
            });
            if (!property) {
                throw new custom_error_1.CustomError(http_response_1.HttpRes.status.NOT_FOUND, http_response_1.HttpRes.message.NOT_FOUND, 'Property not found');
            }
            if (property.user_id !== tenantId) {
                throw new custom_error_1.CustomError(http_response_1.HttpRes.status.FORBIDDEN, http_response_1.HttpRes.message.FORBIDDEN, 'Property does not belong to this tenant');
            }
            propertyId = property.id;
        }
        else {
            // Get first property of tenant
            const property = yield prisma_client_1.default.property.findFirst({
                where: { user_id: tenantId, status: 'active' },
                select: { id: true },
                orderBy: { created_at: 'asc' },
            });
            if (!property) {
                throw new custom_error_1.CustomError(http_response_1.HttpRes.status.NOT_FOUND, http_response_1.HttpRes.message.NOT_FOUND, 'No active properties found for this tenant');
            }
            propertyId = property.id;
        }
        // Call service to get sales report
        const result = yield get_sales_report_service_1.GetSalesReportService.getSalesReport({
            tenantId,
            propertyId,
            startDate: start,
            endDate: end,
        });
        res
            .status(http_response_1.HttpRes.status.OK)
            .json(response_handler_1.ResponseHandler.success('Sales report retrieved successfully', result));
    }
    catch (error) {
        next(error);
    }
});
exports.GetSalesReportController = GetSalesReportController;
