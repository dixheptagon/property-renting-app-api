import { Router } from 'express';
import { CreateOrderController } from './create-order/create.order.controller.js';
import { OrderNotificationController } from './order-notification/order.notification.controller.js';
import { GetBookingController } from './get-booking/get.booking.controller.js';
import { CancelOrderController } from './cancel-order/cancel.order.controller.js';
import { GetOrderListController } from './get-order-list/get.order.list.controller.js';
import { GetBookingListController } from './get-booking-list/get.booking.list.controller.js';
import { UploadPaymentProofController } from './upload-payment-proof/upload.proof.controller.js';
import { uploadPaymentProof } from '../../lib/middlewares/upload.multer.js';
import { verifyToken } from '../../lib/middlewares/verify.token.js';
const bookingRouter = Router();
// Create Booking Order
bookingRouter.post('/booking/create-order', verifyToken, CreateOrderController);
// Webhook Callback from Midtrans to update booking status
bookingRouter.post('/booking/order-notification', OrderNotificationController);
// Upload Payment Proof
bookingRouter.post('/booking/:orderId/upload-payment-proof', verifyToken, uploadPaymentProof().single('payment_proof'), UploadPaymentProofController);
//Get Booking Details
bookingRouter.get('/booking/get-booking/:orderId', verifyToken, GetBookingController);
// Get My Booking List
bookingRouter.get('/booking/my-bookings', verifyToken, GetBookingListController);
// Cancel Booking Order
bookingRouter.post('/booking/:orderId/cancel-order', verifyToken, CancelOrderController);
// Get Order List
bookingRouter.get('/booking/get-order-list', verifyToken, GetOrderListController);
export default bookingRouter;
