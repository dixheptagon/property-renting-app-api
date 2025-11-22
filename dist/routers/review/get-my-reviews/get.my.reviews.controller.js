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
exports.GetMyReviewsController = void 0;
const prisma_client_1 = __importDefault(require("../../../lib/config/prisma.client"));
const custom_error_1 = require("../../../lib/utils/custom.error");
const http_response_1 = require("../../../lib/constant/http.response");
const response_handler_1 = require("../../../lib/utils/response.handler");
const GetMyReviewsController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { page = '1', limit = '10', orderBy = 'reviewCreatedAt', order = 'desc', } = req.query;
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
        const validOrderBy = ['reviewCreatedAt'];
        const validOrder = ['asc', 'desc'];
        if (!validOrderBy.includes(orderBy) ||
            !validOrder.includes(order)) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Invalid order parameters');
        }
        // Get completed bookings with reviews
        const bookingsWithReviews = yield prisma_client_1.default.booking.findMany({
            where: {
                user_id: user.id,
                status: 'completed',
                review: {
                    isNot: null,
                },
            },
            include: {
                property: {
                    select: {
                        id: true,
                        title: true,
                        tenant: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true,
                                display_name: true,
                            },
                        },
                    },
                },
                room: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                review: true,
            },
            orderBy: {
                review: {
                    created_at: order,
                },
            },
            skip: (pageNum - 1) * limitNum,
            take: limitNum,
        });
        // Get total count
        const totalCount = yield prisma_client_1.default.booking.count({
            where: {
                user_id: user.id,
                status: 'completed',
                review: {
                    isNot: null,
                },
            },
        });
        const totalPages = Math.ceil(totalCount / limitNum);
        // Format response data
        const reviewsData = bookingsWithReviews.map((booking) => ({
            booking_uid: booking.uid,
            status: booking.status,
            property: {
                id: booking.property.id,
                name: booking.property.title,
                room_type: booking.room.name,
                tenant: {
                    id: booking.property.tenant.id,
                    first_name: booking.property.tenant.first_name,
                    last_name: booking.property.tenant.last_name,
                    display_name: booking.property.tenant.display_name,
                },
            },
            review: booking.review
                ? {
                    id: booking.review.id,
                    rating: booking.review.rating,
                    comment: booking.review.comment,
                    reply: booking.review.reply,
                    createdAt: booking.review.created_at,
                    updatedAt: booking.review.updated_at,
                }
                : null,
        }));
        const responseData = {
            reviews: reviewsData,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                limit: limitNum,
            },
        };
        res
            .status(http_response_1.HttpRes.status.OK)
            .json(response_handler_1.ResponseHandler.success('My reviews retrieved successfully', responseData));
    }
    catch (error) {
        next(error);
    }
});
exports.GetMyReviewsController = GetMyReviewsController;
