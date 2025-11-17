import { Router } from 'express';
import { GetSalesReportController } from './get-sales-report/get.sales.report.controller';
import { verifyToken } from '../../lib/middlewares/verify.token';
import { verifyTenant } from '../../lib/middlewares/verify.role';

const reportRouter = Router();

// Get Sales Report
reportRouter.get(
  '/tenant/sales-report',
  verifyToken,
  verifyTenant,
  GetSalesReportController,
);

export default reportRouter;
