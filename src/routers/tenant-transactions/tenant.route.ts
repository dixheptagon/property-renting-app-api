import { Router } from 'express';
import { GetOrderListByTenantController } from './get-order-list/get.order.list.controller.js';
import { GetPropertyListByTenantController } from './get-property-list/get.property.list.controller.js';
import { ConfirmOrderController } from './confirm-order/confirm.order.controller.js';
import { RejectOrderController } from './reject-order/reject.order.controller.js';
import { CancelOrderByTenantController } from './cancel-order/cancel.order.controller.js';
import { CompleteOrderController } from './complete-order/complete.order.controller.js';
import { GetBookingByTenantController } from './get-booking-by-tenant/get.booking.by.tenant.controller.js';
import { verifyToken } from '../../lib/middlewares/verify.token.js';
import { verifyTenant } from '../../lib/middlewares/verify.role.js';

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

// Get Booking by Tenant
tenantRouter.get(
  '/tenant/:orderId/get-booking',
  verifyToken,
  verifyTenant,
  GetBookingByTenantController,
);

export default tenantRouter;
