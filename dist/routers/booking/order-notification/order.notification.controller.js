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
exports.OrderNotificationController = void 0;
const prisma_client_1 = __importDefault(require("../../../lib/config/prisma.client"));
const verify_midtrans_signature_1 = require("../../../lib/utils/verify.midtrans.signature");
const custom_error_1 = require("../../../lib/utils/custom.error");
const http_response_1 = require("../../../lib/constant/http.response");
const response_handler_1 = require("../../../lib/utils/response.handler");
const OrderNotificationController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notificationJson = req.body;
        // Parse required fields
        const { order_id, transaction_status, fraud_status, status_code, gross_amount, signature_key, payment_type, } = notificationJson;
        // Verify signature
        const isSignatureValid = (0, verify_midtrans_signature_1.verifyMidtransSignature)(order_id, status_code, gross_amount.toString(), signature_key);
        if (!isSignatureValid) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.UNAUTHORIZED, http_response_1.HttpRes.message.UNAUTHORIZED, `Invalid Midtrans signature for order_id: ${order_id}`);
        }
        // Find booking by uid (order_id)
        const booking = yield prisma_client_1.default.booking.findUnique({
            where: { uid: order_id },
            include: { room: true, property: true },
        });
        if (!booking) {
            // still respond 200 to acknowledge receipt
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.OK, http_response_1.HttpRes.message.OK, `Booking not found for order_id: ${order_id}`);
        }
        // Use transaction for atomicity
        yield prisma_client_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            if (transaction_status === 'settlement' ||
                transaction_status === 'capture') {
                // Only update if still pending_payment
                if (booking.status === 'pending_payment') {
                    // Update booking status to processing
                    yield tx.booking.update({
                        where: { id: booking.id },
                        data: {
                            status: 'processing',
                            paid_at: new Date(),
                            payment_method: payment_type,
                        },
                    });
                }
                else {
                    console.log('Booking status not pending_payment, skipping update');
                }
            }
            else if (transaction_status === 'expire' ||
                transaction_status === 'cancel' ||
                transaction_status === 'deny') {
                console.log('Transaction status is expire/cancel/deny, booking status:', booking.status);
                // Only update if still pending_payment
                if (booking.status === 'pending_payment') {
                    console.log('Updating booking to cancelled');
                    yield tx.booking.update({
                        where: { id: booking.id },
                        data: { status: 'cancelled' },
                    });
                }
                else {
                    console.log('Booking status not pending_payment, skipping cancellation update');
                }
            }
            else {
                console.log('Transaction status not handled:', transaction_status);
            }
            // For other statuses like pending, etc., do nothing
        }));
        console.log('Transaction completed for order_id:', order_id);
        const bookingResponse = 
        // Alaways respond 200 OK
        res
            .status(http_response_1.HttpRes.status.OK)
            .json(response_handler_1.ResponseHandler.success(http_response_1.HttpRes.message.OK + ' : Transaction Successfull', 'Check your inbox and email for more details'));
    }
    catch (error) {
        console.error('Error processing Midtrans notification:', error);
        // Still respond 200 to prevent retries, but log error
        res.status(200).json({ message: 'OK' });
    }
});
exports.OrderNotificationController = OrderNotificationController;
