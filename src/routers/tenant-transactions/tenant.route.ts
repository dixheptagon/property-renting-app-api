import { Router } from 'express';
import { GetOrderListByTenantController } from './get-order-list/get.order.list.controller';
import { ConfirmOrderController } from './confirm-order/confirm.order.controller';
import { RejectOrderController } from './reject-order/reject.order.controller';
import { dummyUserMiddleware } from '../../lib/middlewares/dummy.verify.role';

const tenantRouter = Router();

// Apply dummy user middleware to all tenant routes
tenantRouter.use(dummyUserMiddleware);

// Get Order List by Tenant
tenantRouter.get('/tenant/get-order-list', GetOrderListByTenantController);

// Confirm Order by Tenant
tenantRouter.post('/tenant/:orderId/confirm-order', ConfirmOrderController);

// Reject Order by Tenant
tenantRouter.post('/tenant/:orderId/reject-order', RejectOrderController);

export default tenantRouter;
