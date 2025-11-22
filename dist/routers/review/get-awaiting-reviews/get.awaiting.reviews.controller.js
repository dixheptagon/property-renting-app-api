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
exports.GetAwaitingReviewsController = void 0;
const prisma_client_1 = __importDefault(require("../../../lib/config/prisma.client"));
const custom_error_1 = require("../../../lib/utils/custom.error");
const http_response_1 = require("../../../lib/constant/http.response");
const response_handler_1 = require("../../../lib/utils/response.handler");
const GetAwaitingReviewsController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { page = '1', limit = '10', orderBy = 'createdAt', order = 'desc', } = req.query;
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
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Invalid pagination parameters');
        }
        // Validate orderBy and order parameters
        const validOrderBy = ['createdAt', 'check_in_date'];
        const validOrder = ['asc', 'desc'];
        if (!validOrderBy.includes(orderBy) ||
            !validOrder.includes(order)) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Invalid order parameters');
        }
        // Get completed bookings without reviews
        const bookingsWithoutReviews = yield prisma_client_1.default.booking.findMany({
            where: {
                user_id: user.id,
                status: 'completed',
                review: null,
            },
            include: {
                property: {
                    select: {
                        id: true,
                        title: true,
                        images: {
                            select: {
                                id: true,
                                url: true,
                                is_main: true,
                            },
                        },
                        rooms: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                [orderBy === 'createdAt' ? 'created_at' : 'check_in_date']: order,
            },
            skip: (pageNum - 1) * limitNum,
            take: limitNum,
        });
        // Get total count
        const totalCount = yield prisma_client_1.default.booking.count({
            where: {
                user_id: user.id,
                status: 'completed',
                review: null,
            },
        });
        const totalPages = Math.ceil(totalCount / limitNum);
        // Format response data
        const awaitingReviewsData = bookingsWithoutReviews.map((booking) => {
            var _a;
            return ({
                booking_uid: booking.uid,
                status: booking.status,
                check_in_date: booking.check_in_date,
                check_out_date: booking.check_out_date,
                total_price: booking.total_price,
                property: {
                    id: booking.property.id,
                    name: booking.property.title,
                    room_types: booking.property.rooms.map((room) => room.name),
                    main_image: (_a = booking.property.images.find((image) => image.is_main)) === null || _a === void 0 ? void 0 : _a.url,
                },
            });
        });
        const responseData = {
            awaiting_reviews: awaitingReviewsData,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                limit: limitNum,
            },
        };
        res
            .status(http_response_1.HttpRes.status.OK)
            .json(response_handler_1.ResponseHandler.success('Awaiting reviews retrieved successfully', responseData));
    }
    catch (error) {
        next(error);
    }
});
exports.GetAwaitingReviewsController = GetAwaitingReviewsController;
