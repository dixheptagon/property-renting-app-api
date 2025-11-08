import { Router } from 'express';
import { CreateOrderController } from './create-order/create.order.controller';
import { OrderNotificationController } from './order-notification/order.notification.controller';
import { GetBookingController } from './get-booking/get.booking.controller';
import { CancelOrderController } from './cancel-order/cancel.order.controller';
import { GetOrderListController } from './get-order-list/get.order.list.controller';
import { GetBookingListController } from './get-booking-list/get.booking.list.controller';
import { UploadPaymentProofController } from './upload-payment-proof/upload.proof.controller';
import { uploadPaymentProof } from '../../lib/middlewares/upload.multer';
import { verifyToken } from '../../lib/middlewares/verify.token';

const bookingRouter = Router();

// Create Booking Order
bookingRouter.post('/booking/create-order', verifyToken, CreateOrderController);

// Webhook Callback from Midtrans to update booking status
bookingRouter.post('/booking/order-notification', OrderNotificationController);
// Upload Payment Proof
bookingRouter.post(
  '/booking/:orderId/upload-payment-proof',
  uploadPaymentProof().single('payment_proof'),
  UploadPaymentProofController,
);
//Get Booking Details
bookingRouter.get('/booking/get-booking/:orderId', GetBookingController);

// Get My Booking List
bookingRouter.get(
  '/booking/my-bookings',
  verifyToken,
  GetBookingListController,
);

// Cancel Booking Order
bookingRouter.post('/booking/:orderId/cancel-order', CancelOrderController);

// Get Order List
bookingRouter.get('/booking/get-order-list', GetOrderListController);

export default bookingRouter;
