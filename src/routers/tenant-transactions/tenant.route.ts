import { Router } from 'express';
import { GetOrderListByTenantController } from './get-order-list/get.order.list.controller';
import { ConfirmOrderController } from './confirm-order/confirm.order.controller';
import { RejectOrderController } from './reject-order/reject.order.controller';
import { CancelOrderByTenantController } from './cancel-order/cancel.order.controller';
import { CompleteOrderController } from './complete-order/complete.order.controller';
import { dummyUserMiddleware } from '../../lib/middlewares/dummy.verify.role';

const tenantRouter = Router();

// Apply dummy user middleware to all tenant routes
tenantRouter.use(dummyUserMiddleware as any);

// Get Order List by Tenant
tenantRouter.get(
  '/tenant/get-order-list',
  GetOrderListByTenantController as any,
);

// Confirm Order by Tenant
tenantRouter.post(
  '/tenant/:orderId/confirm-order',
  ConfirmOrderController as any,
);

// Reject Order by Tenant
tenantRouter.post(
  '/tenant/:orderId/reject-order',
  RejectOrderController as any,
);

// Cancel Order by Tenant
tenantRouter.post(
  '/tenant/:orderId/cancel-order',
  CancelOrderByTenantController as any,
);

// Complete Order by Tenant
tenantRouter.post(
  '/tenant/:orderId/complete-order',
  CompleteOrderController as any,
);

export default tenantRouter;
