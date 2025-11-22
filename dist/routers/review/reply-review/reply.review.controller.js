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
exports.ReplyReviewController = void 0;
const reply_review_validation_1 = require("./reply.review.validation");
const prisma_client_1 = __importDefault(require("../../../lib/config/prisma.client"));
const custom_error_1 = require("../../../lib/utils/custom.error");
const http_response_1 = require("../../../lib/constant/http.response");
const response_handler_1 = require("../../../lib/utils/response.handler");
const ReplyReviewController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { booking_uid, reply_comment } = yield reply_review_validation_1.ReplyReviewSchema.validate(req.body, {
            abortEarly: false,
        });
        // Get user from verifyToken middleware
        const userUid = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        if (!userUid) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.UNAUTHORIZED, http_response_1.HttpRes.message.UNAUTHORIZED, 'User not authenticated');
        }
        // Get user by UID
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
                property: true,
                review: true,
            },
        });
        if (!booking) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.NOT_FOUND, http_response_1.HttpRes.message.NOT_FOUND, 'Booking not found');
        }
        // Check if review exists
        if (!booking.review) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.NOT_FOUND, http_response_1.HttpRes.message.NOT_FOUND, 'Review not found for this booking');
        }
        // Check if tenant owns the property
        if (booking.property.user_id !== user.id) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.FORBIDDEN, http_response_1.HttpRes.message.FORBIDDEN, 'You can only reply to reviews for properties you own');
        }
        // Update review with reply
        const updatedReview = yield prisma_client_1.default.review.update({
            where: { id: booking.review.id },
            data: {
                reply: reply_comment,
                updated_at: new Date(),
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
                    },
                },
                property: {
                    select: {
                        title: true,
                    },
                },
            },
        });
        res.status(http_response_1.HttpRes.status.OK).json(response_handler_1.ResponseHandler.success('Reply added to review successfully', {
            id: updatedReview.id,
            reply_comment: updatedReview.reply,
        }));
    }
    catch (error) {
        next(error);
    }
});
exports.ReplyReviewController = ReplyReviewController;
