import { Router } from 'express';
import { GetOrderListByTenantController } from './get-order-list/get.order.list.controller';
import { GetPropertyListByTenantController } from './get-property-list/get.property.list.controller';
import { ConfirmOrderController } from './confirm-order/confirm.order.controller';
import { RejectOrderController } from './reject-order/reject.order.controller';
import { CancelOrderByTenantController } from './cancel-order/cancel.order.controller';
import { CompleteOrderController } from './complete-order/complete.order.controller';
import { verifyToken } from '../../lib/middlewares/verify.token';
import { verifyTenant } from '../../lib/middlewares/verify.role';

const tenantRouter = Router();

// Get Order List by Tenant
tenantRouter.get(
  '/tenant/get-order-list',
  verifyToken,
  verifyTenant,
  GetOrderListByTenantController,
);

// Get Property List by Tenant
tenantRouter.get(
  '/tenant/get-property-list',
  verifyToken,
  verifyTenant,
  GetPropertyListByTenantController,
);

// Confirm Order by Tenant
tenantRouter.post(
  '/tenant/:orderId/confirm-order',
  verifyToken,
  verifyTenant,
  ConfirmOrderController,
);

// Reject Order by Tenant
tenantRouter.post(
  '/tenant/:orderId/reject-order',
  verifyToken,
  verifyTenant,
  RejectOrderController,
);

// Cancel Order by Tenant
tenantRouter.post(
  '/tenant/:orderId/cancel-order',
  verifyToken,
  verifyTenant,
  CancelOrderByTenantController,
);

// Complete Order by Tenant
tenantRouter.post(
  '/tenant/:orderId/complete-order',
  verifyToken,
  verifyTenant,
  CompleteOrderController,
);

export default tenantRouter;
