"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
// Logger middleware to log request details
const requestLogger = (req, res, next) => {
    const { method, url } = req;
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${method} request to ${url}`);
    next(); // Call next to continue to the next middleware or route handler
};
exports.requestLogger = requestLogger;
