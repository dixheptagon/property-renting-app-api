import express, { Request, Response, Application } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { requestLogger } from './lib/middlewares/request.logger';
import { errorMiddleware } from './lib/middlewares/error.handler';

// setup express
const app: Application = express();

// setup middleware : CORS
app.use(
  cors({
    origin: 'http://localhost:3000', // FE lo
    credentials: true, // kalau pake cookies
  }),
); // Semua client dapat mengakses API kita

// setup middleware: body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// setup middleware: cookie parser
app.use(cookieParser());

// setup middleware: LOGGING
app.use(requestLogger);

// expose public folder
app.use('/public', express.static('public'));

// setup middleware: CORS (Cross-Origin Resource Sharing)

// define root routes
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to the Express server!',
  });
});

// import routers

import authRouter from './routers/auth/auth.route';
import bookingRouter from './routers/booking/booking.route';
import tenantRouter from './routers/tenant-transactions/tenant.route';
import reviewRoute from './routers/review/review.route';
import propertiesRouter from './routers/properties/properties.route';
import reportRouter from './routers/report/report.route';

// use user router

const routers = [
  authRouter,
  bookingRouter,
  propertiesRouter,
  reviewRoute,
  tenantRouter,
  reportRouter,
];
routers.forEach((router) => {
  app.use('/api', router);
});

// Initialize auto-cancel cron job
import { AutoCancelOrder } from './routers/booking/auto-cancel-order/auto.cancel.order.controller';
AutoCancelOrder();

// Initialize auto order reminder cron job
import { AutoOrderReminderController } from './routers/tenant-transactions/auto-order-reminder/auto.order.reminder.controller';
AutoOrderReminderController();

// Initialize auto complete order cron job
import { AutoCompleteOrderController } from './routers/tenant-transactions/auto-complete-order/auto.complete.order.controller';

AutoCompleteOrderController();

// Initialize auto delete temp property image cron job
import { AutoDeleteTempPropertyImage } from './routers/properties/auto-delete-temp-image/auto.delete.temp.property.image.controller';

AutoDeleteTempPropertyImage();

// Initialize auto delete temp room image cron job
import { AutoDeleteTempRoomImage } from './routers/properties/auto-delete-temp-image/auto.delete.temp.room.image.controller';

AutoDeleteTempRoomImage();

// setup error handler middleware
app.use(errorMiddleware);

// export app for server
export default app;
