"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const request_logger_1 = require("./lib/middlewares/request.logger");
const error_handler_1 = require("./lib/middlewares/error.handler");
// setup express
const app = (0, express_1.default)();
// setup middleware : CORS
app.use((0, cors_1.default)({
    origin: 'http://localhost:3000', // FE lo
    credentials: true, // kalau pake cookies
})); // Semua client dapat mengakses API kita
// setup middleware: body parser
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
// setup middleware: cookie parser
app.use((0, cookie_parser_1.default)());
// setup middleware: LOGGING
app.use(request_logger_1.requestLogger);
// expose public folder
app.use('/public', express_1.default.static('public'));
// setup middleware: CORS (Cross-Origin Resource Sharing)
// define root routes
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Welcome to the Express server!',
    });
});
// import routers
const auth_route_1 = __importDefault(require("./routers/auth/auth.route"));
const booking_route_1 = __importDefault(require("./routers/booking/booking.route"));
const tenant_route_1 = __importDefault(require("./routers/tenant-transactions/tenant.route"));
const review_route_1 = __importDefault(require("./routers/review/review.route"));
const properties_route_1 = __importDefault(require("./routers/properties/properties.route"));
const report_route_1 = __importDefault(require("./routers/report/report.route"));
// use user router
const routers = [
    auth_route_1.default,
    booking_route_1.default,
    properties_route_1.default,
    review_route_1.default,
    tenant_route_1.default,
    report_route_1.default,
];
routers.forEach((router) => {
    app.use('/api', router);
});
// Initialize auto-cancel cron job
const auto_cancel_order_controller_1 = require("./routers/booking/auto-cancel-order/auto.cancel.order.controller");
(0, auto_cancel_order_controller_1.AutoCancelOrder)();
// Initialize auto order reminder cron job
const auto_order_reminder_controller_1 = require("./routers/tenant-transactions/auto-order-reminder/auto.order.reminder.controller");
(0, auto_order_reminder_controller_1.AutoOrderReminderController)();
// Initialize auto complete order cron job
const auto_complete_order_controller_1 = require("./routers/tenant-transactions/auto-complete-order/auto.complete.order.controller");
(0, auto_complete_order_controller_1.AutoCompleteOrderController)();
// Initialize auto delete temp property image cron job
const auto_delete_temp_property_image_controller_1 = require("./routers/properties/auto-delete-temp-image/auto.delete.temp.property.image.controller");
(0, auto_delete_temp_property_image_controller_1.AutoDeleteTempPropertyImage)();
// Initialize auto delete temp room image cron job
const auto_delete_temp_room_image_controller_1 = require("./routers/properties/auto-delete-temp-image/auto.delete.temp.room.image.controller");
(0, auto_delete_temp_room_image_controller_1.AutoDeleteTempRoomImage)();
// setup error handler middleware
app.use(error_handler_1.errorMiddleware);
// export app for server
exports.default = app;
