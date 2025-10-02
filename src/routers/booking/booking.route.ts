import { Router } from 'express';
import { CreateOrderController } from './create-order/create.order.controller';
import { OrderNotificationController } from './order-notification/order.notification.controller';
import { GetBookingController } from './get-booking/get.booking.controller';
import { CancelOrderController } from './cancel-order/cancel.order.controller';
import { GetOrderListController } from './get-order-list/get.order.list.controller';
import { UploadPaymentProofController } from './upload-payment-proof/upload.proof.controller';
import { uploadPaymentProof } from '../../lib/middlewares/upload.multer';

const bookingRouter = Router();

// 1. Create Booking Order
bookingRouter.post('/booking/create-order', CreateOrderController);
// 2.a Webhook Callback from Midtrans to update booking status
bookingRouter.post('/booking/order-notification', OrderNotificationController);
// 2.b Upload Payment Proof
bookingRouter.post(
  '/booking/:orderId/upload-payment-proof',
  uploadPaymentProof().single('payment_proof'),
  UploadPaymentProofController,
);
// 3. Get Booking Details
bookingRouter.get('/booking/get-booking/:orderId', GetBookingController);
// 4. Cancel Booking Order
bookingRouter.post('/booking/:orderId/cancel-order', CancelOrderController);
// 5. Get Order List
bookingRouter.get('/booking/get-order-list', GetOrderListController);

export default bookingRouter;
