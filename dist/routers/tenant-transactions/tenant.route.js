"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const get_order_list_controller_1 = require("./get-order-list/get.order.list.controller");
const get_property_list_controller_1 = require("./get-property-list/get.property.list.controller");
const confirm_order_controller_1 = require("./confirm-order/confirm.order.controller");
const reject_order_controller_1 = require("./reject-order/reject.order.controller");
const cancel_order_controller_1 = require("./cancel-order/cancel.order.controller");
const complete_order_controller_1 = require("./complete-order/complete.order.controller");
const verify_token_1 = require("../../lib/middlewares/verify.token");
const verify_role_1 = require("../../lib/middlewares/verify.role");
const tenantRouter = (0, express_1.Router)();
// Get Order List by Tenant
tenantRouter.get('/tenant/get-order-list', verify_token_1.verifyToken, verify_role_1.verifyTenant, get_order_list_controller_1.GetOrderListByTenantController);
// Get Property List by Tenant
tenantRouter.get('/tenant/get-property-list', verify_token_1.verifyToken, verify_role_1.verifyTenant, get_property_list_controller_1.GetPropertyListByTenantController);
// Confirm Order by Tenant
tenantRouter.post('/tenant/:orderId/confirm-order', verify_token_1.verifyToken, verify_role_1.verifyTenant, confirm_order_controller_1.ConfirmOrderController);
// Reject Order by Tenant
tenantRouter.post('/tenant/:orderId/reject-order', verify_token_1.verifyToken, verify_role_1.verifyTenant, reject_order_controller_1.RejectOrderController);
// Cancel Order by Tenant
tenantRouter.post('/tenant/:orderId/cancel-order', verify_token_1.verifyToken, verify_role_1.verifyTenant, cancel_order_controller_1.CancelOrderByTenantController);
// Complete Order by Tenant
tenantRouter.post('/tenant/:orderId/complete-order', verify_token_1.verifyToken, verify_role_1.verifyTenant, complete_order_controller_1.CompleteOrderController);
exports.default = tenantRouter;
