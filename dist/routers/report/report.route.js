"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const get_sales_report_controller_1 = require("./get-sales-report/get.sales.report.controller");
const get_property_report_controller_1 = require("./get-property-report/get.property.report.controller");
const verify_token_1 = require("../../lib/middlewares/verify.token");
const verify_role_1 = require("../../lib/middlewares/verify.role");
const reportRouter = (0, express_1.Router)();
// Get Sales Report
reportRouter.get('/tenant/sales-report', verify_token_1.verifyToken, verify_role_1.verifyTenant, get_sales_report_controller_1.GetSalesReportController);
// Get Property Report
reportRouter.get('/tenant/property-report', verify_token_1.verifyToken, verify_role_1.verifyTenant, get_property_report_controller_1.getPropertyReportController);
exports.default = reportRouter;
