import { Router } from 'express';
import { GetOrderListByTenantController } from './get-order-list/get.order.list.controller';
import { dummyUserMiddleware } from '../../lib/middlewares/dummy.verify.role';

const tenantRouter = Router();

// Apply dummy user middleware to all tenant routes
tenantRouter.use(dummyUserMiddleware);

// Get Order List by Tenant
tenantRouter.get('/tenant/get-order-list', GetOrderListByTenantController);

export default tenantRouter;
