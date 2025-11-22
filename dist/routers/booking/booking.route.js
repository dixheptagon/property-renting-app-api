"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const create_order_controller_1 = require("./create-order/create.order.controller");
const order_notification_controller_1 = require("./order-notification/order.notification.controller");
const get_booking_controller_1 = require("./get-booking/get.booking.controller");
const cancel_order_controller_1 = require("./cancel-order/cancel.order.controller");
const get_order_list_controller_1 = require("./get-order-list/get.order.list.controller");
const get_booking_list_controller_1 = require("./get-booking-list/get.booking.list.controller");
const upload_proof_controller_1 = require("./upload-payment-proof/upload.proof.controller");
const upload_multer_1 = require("../../lib/middlewares/upload.multer");
const verify_token_1 = require("../../lib/middlewares/verify.token");
const bookingRouter = (0, express_1.Router)();
// Create Booking Order
bookingRouter.post('/booking/create-order', verify_token_1.verifyToken, create_order_controller_1.CreateOrderController);
// Webhook Callback from Midtrans to update booking status
bookingRouter.post('/booking/order-notification', order_notification_controller_1.OrderNotificationController);
// Upload Payment Proof
bookingRouter.post('/booking/:orderId/upload-payment-proof', verify_token_1.verifyToken, (0, upload_multer_1.uploadPaymentProof)().single('payment_proof'), upload_proof_controller_1.UploadPaymentProofController);
//Get Booking Details
bookingRouter.get('/booking/get-booking/:orderId', verify_token_1.verifyToken, get_booking_controller_1.GetBookingController);
// Get My Booking List
bookingRouter.get('/booking/my-bookings', verify_token_1.verifyToken, get_booking_list_controller_1.GetBookingListController);
// Cancel Booking Order
bookingRouter.post('/booking/:orderId/cancel-order', verify_token_1.verifyToken, cancel_order_controller_1.CancelOrderController);
// Get Order List
bookingRouter.get('/booking/get-order-list', verify_token_1.verifyToken, get_order_list_controller_1.GetOrderListController);
exports.default = bookingRouter;
