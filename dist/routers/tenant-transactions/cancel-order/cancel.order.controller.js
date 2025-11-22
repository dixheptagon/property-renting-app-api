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
exports.CancelOrderByTenantController = void 0;
const prisma_client_1 = __importDefault(require("../../../lib/config/prisma.client"));
const custom_error_1 = require("../../../lib/utils/custom.error");
const http_response_1 = require("../../../lib/constant/http.response");
const response_handler_1 = require("../../../lib/utils/response.handler");
const cancel_order_validation_1 = require("./cancel.order.validation");
const CancelOrderByTenantController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Get order ID from URL params
        const { orderId } = req.params;
        if (!orderId ||
            typeof orderId !== 'string' ||
            !orderId.startsWith('ORDER-')) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Invalid order ID format. Expected format: ORDER-xxxxx');
        }
        // Validate request body
        const { cancellation_reason } = yield cancel_order_validation_1.CancelOrderByTenantSchema.validate(req.body, {
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
        // Find booking with property details
        const booking = yield prisma_client_1.default.booking.findUnique({
            where: { uid: orderId },
            include: {
                property: true,
            },
        });
        if (!booking) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.NOT_FOUND, http_response_1.HttpRes.message.NOT_FOUND, 'Booking not found');
        }
        // Check if tenant owns the property
        if (booking.property.user_id !== user.id) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.FORBIDDEN, http_response_1.HttpRes.message.FORBIDDEN, 'Access denied. You can only cancel orders for your own properties.');
        }
        // Check if booking is in pending_payment status
        if (booking.status !== 'pending_payment') {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, `Cannot cancel booking. Current status: ${booking.status}. Only pending_payment bookings can be cancelled by tenant.`);
        }
        // Update booking status to cancelled and store cancellation reason
        const updatedBooking = yield prisma_client_1.default.booking.update({
            where: { uid: orderId },
            data: {
                status: 'cancelled',
                cancellation_reason: cancellation_reason,
            },
        });
        res.status(http_response_1.HttpRes.status.OK).json(response_handler_1.ResponseHandler.success('Booking cancelled successfully by tenant.', {
            booking_id: updatedBooking.id,
            order_uid: updatedBooking.uid,
            status: updatedBooking.status,
            cancellation_reason: updatedBooking.cancellation_reason,
        }));
    }
    catch (error) {
        next(error);
    }
});
exports.CancelOrderByTenantController = CancelOrderByTenantController;
