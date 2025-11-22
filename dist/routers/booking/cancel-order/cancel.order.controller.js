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
exports.CancelOrderController = void 0;
const prisma_client_1 = __importDefault(require("../../../lib/config/prisma.client"));
const custom_error_1 = require("../../../lib/utils/custom.error");
const http_response_1 = require("../../../lib/constant/http.response");
const response_handler_1 = require("../../../lib/utils/response.handler");
const cancel_order_validation_1 = require("./cancel.order.validation");
const CancelOrderController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { orderId } = req.params;
        if (!orderId ||
            typeof orderId !== 'string' ||
            !orderId.startsWith('ORDER-')) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Invalid order ID format. Expected format: ORDER-xxxxx');
        }
        const { cancellation_reason } = yield cancel_order_validation_1.CancelOrderSchema.validate(req.body, {
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
            where: { uid: orderId, user_id: user.id },
        });
        if (!booking) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.NOT_FOUND, http_response_1.HttpRes.message.NOT_FOUND, 'Booking not found');
        }
        // Check if booking status allows cancellation
        if (booking.status !== 'pending_payment') {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Cancellation not allowed. Booking must be in pending_payment status.');
        }
        // Update booking status to cancelled
        const updatedBooking = yield prisma_client_1.default.booking.update({
            where: { id: booking.id },
            data: { status: 'cancelled', cancellation_reason },
        });
        // Return success response
        res.status(http_response_1.HttpRes.status.OK).json(response_handler_1.ResponseHandler.success('Booking cancelled successfully', {
            id: updatedBooking.id,
            uid: updatedBooking.uid,
            status: updatedBooking.status,
            cancellation_reason,
        }));
    }
    catch (error) {
        next(error);
    }
});
exports.CancelOrderController = CancelOrderController;
