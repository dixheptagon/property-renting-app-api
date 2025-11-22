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
exports.GetOrderListByTenantController = void 0;
const get_order_list_service_1 = require("./get.order.list.service");
const custom_error_1 = require("../../../lib/utils/custom.error");
const http_response_1 = require("../../../lib/constant/http.response");
const response_handler_1 = require("../../../lib/utils/response.handler");
const prisma_client_1 = __importDefault(require("../../../lib/config/prisma.client"));
const GetOrderListByTenantController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
        const { 'status[]': status, 'category[]': category, date_from, date_to, sort_by = 'created_at', sort_dir = 'desc', } = req.query;
        // Validate status
        let statusFilter;
        if (status) {
            const validStatuses = [
                'pending_payment',
                'processing',
                'confirmed',
                'cancelled',
                'completed',
            ];
            if (Array.isArray(status)) {
                statusFilter = status.map((s) => s.toLowerCase());
                for (const s of statusFilter) {
                    if (!validStatuses.includes(s)) {
                        throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Invalid status parameter');
                    }
                }
            }
            else if (typeof status === 'string') {
                if (!validStatuses.includes(status.toLowerCase())) {
                    throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Invalid status parameter');
                }
                statusFilter = [status.toLowerCase()];
            }
        }
        // Validate category
        let categoryFilter;
        if (category) {
            const validCategories = ['house', 'apartment', 'hotel', 'villa', 'room'];
            if (Array.isArray(category)) {
                categoryFilter = category.map((c) => c.toLowerCase());
                for (const c of categoryFilter) {
                    if (!validCategories.includes(c)) {
                        throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Invalid category parameter');
                    }
                }
            }
            else if (typeof category === 'string') {
                if (!validCategories.includes(category.toLowerCase())) {
                    throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Invalid category parameter');
                }
                categoryFilter = [category.toLowerCase()];
            }
        }
        // Validate dates
        let dateFrom;
        let dateTo;
        if (date_from && typeof date_from === 'string') {
            dateFrom = new Date(date_from);
            if (isNaN(dateFrom.getTime())) {
                throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Invalid date_from format. Use YYYY-MM-DD');
            }
        }
        if (date_to && typeof date_to === 'string') {
            dateTo = new Date(date_to);
            if (isNaN(dateTo.getTime())) {
                throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Invalid date_to format. Use YYYY-MM-DD');
            }
        }
        // Validate sort_by
        let sortBy;
        if (sort_by && typeof sort_by === 'string') {
            const validSortFields = ['created_at', 'check_in_date', 'total_price'];
            if (!validSortFields.includes(sort_by)) {
                throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Invalid sort_by parameter. Valid values: created_at, check_in_date, total_price');
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
                throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Invalid sort_dir parameter. Valid values: asc, desc');
            }
            sortDir = sort_dir.toLowerCase();
        }
        else {
            sortDir = 'desc';
        }
        // Call service
        const result = yield get_order_list_service_1.GetOrderListService.getOrderListByTenant({
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
            .status(http_response_1.HttpRes.status.OK)
            .json(response_handler_1.ResponseHandler.success('Order list retrieved successfully', result));
    }
    catch (error) {
        next(error);
    }
});
exports.GetOrderListByTenantController = GetOrderListByTenantController;
