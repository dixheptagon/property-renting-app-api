"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dummyUserMiddleware = void 0;
const custom_error_1 = require("../utils/custom.error");
const http_response_1 = require("../constant/http.response");
const dummyUserMiddleware = (req, res, next) => {
    const userHeader = req.headers['x-user'];
    if (userHeader) {
        try {
            req.user = JSON.parse(userHeader);
        }
        catch (err) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Invalid user header');
        }
    }
    next();
};
exports.dummyUserMiddleware = dummyUserMiddleware;
