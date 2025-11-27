import { Router } from 'express';
import { GetSalesReportController } from './get-sales-report/get.sales.report.controller.js';
import { getPropertyReportController } from './get-property-report/get.property.report.controller.js';
import { verifyToken } from '../../lib/middlewares/verify.token.js';
import { verifyTenant } from '../../lib/middlewares/verify.role.js';
const reportRouter = Router();
// Get Sales Report
reportRouter.get('/tenant/sales-report', verifyToken, verifyTenant, GetSalesReportController);
// Get Property Report
reportRouter.get('/tenant/property-report', verifyToken, verifyTenant, getPropertyReportController);
export default reportRouter;
