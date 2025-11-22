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
exports.UploadPaymentProofController = void 0;
const prisma_client_1 = __importDefault(require("../../../lib/config/prisma.client"));
const custom_error_1 = require("../../../lib/utils/custom.error");
const http_response_1 = require("../../../lib/constant/http.response");
const cloudinary_1 = require("../../../lib/config/cloudinary");
const response_handler_1 = require("../../../lib/utils/response.handler");
const UploadPaymentProofController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { orderId } = req.params;
        // Validate orderId
        if (!orderId) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Order ID is required');
        }
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
        // Find booking by uid (assuming orderId is uid)
        const booking = yield prisma_client_1.default.booking.findUnique({
            where: { uid: orderId, user_id: user.id },
        });
        if (!booking) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.NOT_FOUND, http_response_1.HttpRes.message.NOT_FOUND, 'Booking not found');
        }
        // Check if status is pending_payment
        if (booking.status !== 'pending_payment') {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Payment proof can only be uploaded for bookings with pending_payment status');
        }
        // Check if file is uploaded
        if (!req.file) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Payment proof file is required');
        }
        // Upload to Cloudinary
        const uploadResult = (yield (0, cloudinary_1.cloudinaryUploadPaymentProof)(req.file.buffer));
        if (!uploadResult || !uploadResult.secure_url) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.INTERNAL_SERVER_ERROR, http_response_1.HttpRes.message.INTERNAL_SERVER_ERROR, 'Failed to upload payment proof to cloud storage');
        }
        // Update booking with payment proof URL and status to processing
        const updatedBooking = yield prisma_client_1.default.booking.update({
            where: { uid: orderId },
            data: {
                payment_proof: uploadResult.secure_url,
                status: 'processing',
                paid_at: new Date(),
                payment_method: 'bank_transfer',
                cancellation_reason: null,
            },
        });
        // Send success response
        res.status(http_response_1.HttpRes.status.OK).json(response_handler_1.ResponseHandler.success('Payment proof uploaded successfully', {
            payment_proof: updatedBooking.payment_proof,
        }));
    }
    catch (error) {
        next(error);
    }
});
exports.UploadPaymentProofController = UploadPaymentProofController;
