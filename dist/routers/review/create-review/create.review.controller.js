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
exports.CreateReviewController = void 0;
const create_review_validation_1 = require("./create.review.validation");
const prisma_client_1 = __importDefault(require("../../../lib/config/prisma.client"));
const custom_error_1 = require("../../../lib/utils/custom.error");
const http_response_1 = require("../../../lib/constant/http.response");
const response_handler_1 = require("../../../lib/utils/response.handler");
const CreateReviewController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { booking_uid } = req.params;
        const { comment, rating } = yield create_review_validation_1.CreateReviewSchema.validate(req.body, {
            abortEarly: false,
        });
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
        // Find booking by uid
        const booking = yield prisma_client_1.default.booking.findUnique({
            where: { uid: booking_uid },
            include: {
                property: {
                    select: {
                        id: true,
                    },
                },
                review: true,
            },
        });
        if (!booking) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.NOT_FOUND, http_response_1.HttpRes.message.NOT_FOUND, 'Booking not found');
        }
        // Check if booking belongs to authenticated user
        if (booking.user_id !== user.id) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.FORBIDDEN, http_response_1.HttpRes.message.FORBIDDEN, 'You can only review your own bookings');
        }
        // Check if booking status is completed
        if (booking.status !== 'completed') {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'You can only review completed bookings');
        }
        // Check if current date is after checkout date
        const currentDate = new Date();
        const checkoutDate = new Date(booking.check_out_date);
        if (currentDate <= checkoutDate) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'You can only review after the checkout date');
        }
        // Check if review already exists for this booking
        if (booking.review) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.CONFLICT, http_response_1.HttpRes.message.CONFLICT, 'Review already exists for this booking');
        }
        // Create review
        const review = yield prisma_client_1.default.review.create({
            data: {
                booking_id: booking.id,
                user_id: user.id,
                property_id: booking.property_id,
                rating: rating,
                comment: comment,
            },
            include: {
                user: {
                    select: {
                        first_name: true,
                        last_name: true,
                        display_name: true,
                    },
                },
                booking: {
                    select: {
                        uid: true,
                        check_in_date: true,
                        check_out_date: true,
                    },
                },
            },
        });
        // Prepare response data
        const responseData = {
            booking_uid: booking.uid,
            status: booking.status,
            review: {
                id: review.id,
                rating: review.rating,
                comment: review.comment,
                reply: null,
                createdAt: review.created_at,
                updatedAt: review.updated_at,
            },
        };
        res
            .status(http_response_1.HttpRes.status.CREATED)
            .json(response_handler_1.ResponseHandler.success('Review created successfully', responseData));
    }
    catch (error) {
        next(error);
    }
});
exports.CreateReviewController = CreateReviewController;
