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
exports.GetOrderListController = void 0;
const prisma_client_1 = __importDefault(require("../../../lib/config/prisma.client"));
const custom_error_1 = require("../../../lib/utils/custom.error");
const http_response_1 = require("../../../lib/constant/http.response");
const response_handler_1 = require("../../../lib/utils/response.handler");
const GetOrderListController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(50, Number(req.query.limit) || 20);
        const skip = (page - 1) * limit;
        const { order_id, date_from, date_to, status, sort_by = 'created_at', sort_dir = 'desc', } = req.query;
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
        const where = {
            user_id: user.id,
        };
        // Order ID filtering (partial search)
        if (order_id && typeof order_id === 'string') {
            where.uid = {
                contains: order_id,
                mode: 'insensitive',
            };
        }
        // Status filtering
        if (status) {
            const validStatuses = [
                'pending_payment',
                'processing',
                'confirmed',
                'cancelled',
                'completed',
            ];
            let statusArray = [];
            if (typeof status === 'string') {
                statusArray = [status.toLowerCase()];
            }
            else if (Array.isArray(status)) {
                statusArray = status.map((s) => typeof s === 'string' ? s.toLowerCase() : '');
            }
            // Validate all statuses
            const invalidStatuses = statusArray.filter((s) => !validStatuses.includes(s));
            if (invalidStatuses.length > 0) {
                throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, `Invalid status(es): ${invalidStatuses.join(', ')}`);
            }
            // Apply status filter
            if (statusArray.length === 1) {
                where.status = statusArray[0];
            }
            else if (statusArray.length > 1) {
                where.status = { in: statusArray };
            }
        }
        // Date filtering (on created_at)
        if (date_from || date_to) {
            where.created_at = {};
            if (date_from && typeof date_from === 'string') {
                const fromDate = new Date(date_from);
                if (isNaN(fromDate.getTime())) {
                    throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Invalid date_from format');
                }
                where.created_at.gte = fromDate;
            }
            if (date_to && typeof date_to === 'string') {
                const toDate = new Date(date_to);
                if (isNaN(toDate.getTime())) {
                    throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Invalid date_to format');
                }
                where.created_at.lte = toDate;
            }
        }
        // Sorting
        const orderBy = {};
        if (sort_by === 'created_at' || sort_by === 'check_in_date') {
            orderBy[sort_by] = sort_dir === 'asc' ? 'asc' : 'desc';
        }
        else {
            orderBy.created_at = 'desc'; // default
        }
        // Get total count
        const total = yield prisma_client_1.default.booking.count({ where });
        // Get bookings
        const bookings = yield prisma_client_1.default.booking.findMany({
            where,
            include: {
                room: {
                    include: {
                        property: {
                            include: {
                                images: true,
                            },
                        },
                    },
                },
            },
            orderBy,
            skip,
            take: limit,
        });
        if (bookings.length === 0) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.NOT_FOUND, http_response_1.HttpRes.message.NOT_FOUND, 'No orders found matching the criteria');
        }
        // Format response
        const data = bookings.map((booking) => {
            var _a;
            return ({
                order_id: booking.uid,
                room: {
                    name: booking.room.name,
                    description: booking.room.description,
                    property: {
                        name: booking.room.property.title,
                        address: booking.room.property.address,
                        city: booking.room.property.city,
                        main_image: (_a = booking.room.property.images.find((image) => image.is_main)) === null || _a === void 0 ? void 0 : _a.url,
                    },
                },
                status: booking.status,
                check_in_date: booking.check_in_date,
                check_out_date: booking.check_out_date,
                total_price: booking.total_price,
                created_at: booking.created_at,
            });
        });
        const response = {
            data,
            pagination: {
                page,
                limit,
                total,
                total_pages: Math.ceil(total / limit),
            },
        };
        res
            .status(http_response_1.HttpRes.status.OK)
            .json(response_handler_1.ResponseHandler.success('Orders retrieved successfully', response));
    }
    catch (error) {
        next(error);
    }
});
exports.GetOrderListController = GetOrderListController;
