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
exports.GetBookingController = void 0;
const prisma_client_1 = __importDefault(require("../../../lib/config/prisma.client"));
const custom_error_1 = require("../../../lib/utils/custom.error");
const http_response_1 = require("../../../lib/constant/http.response");
const response_handler_1 = require("../../../lib/utils/response.handler");
const GetBookingController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { orderId } = req.params;
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
            include: {
                room: {
                    include: {
                        property: {
                            include: {
                                images: true,
                                tenant: {
                                    select: {
                                        email: true,
                                    },
                                },
                            },
                        },
                    },
                },
                user: true,
            },
        });
        if (!booking) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.NOT_FOUND, http_response_1.HttpRes.message.NOT_FOUND, 'Booking not found');
        }
        // Return booking details
        const responseData = {
            id: booking.id,
            uid: booking.uid,
            status: booking.status,
            check_in_date: booking.check_in_date,
            check_out_date: booking.check_out_date,
            total_price: booking.total_price,
            fullname: booking.fullname,
            email: booking.email,
            phone_number: booking.phone_number,
            payment_method: booking.payment_method,
            payment_proof: booking.payment_proof,
            cancellation_reason: booking.cancellation_reason,
            transaction_id: booking.transaction_id,
            paid_at: booking.paid_at,
            room: {
                id: booking.room.id,
                name: booking.room.name,
                property: {
                    id: booking.room.property.id,
                    tenant_email: booking.room.property.tenant.email,
                    title: booking.room.property.title,
                    address: booking.room.property.address,
                    city: booking.room.property.city,
                    main_image: (_b = booking.room.property.images.find((image) => image.is_main)) === null || _b === void 0 ? void 0 : _b.url,
                },
            },
        };
        res
            .status(http_response_1.HttpRes.status.OK)
            .json(response_handler_1.ResponseHandler.success('Booking retrieved successfully', responseData));
    }
    catch (error) {
        next(error);
    }
});
exports.GetBookingController = GetBookingController;
