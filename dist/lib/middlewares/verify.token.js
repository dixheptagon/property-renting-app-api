"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = __importDefault(require("../../env"));
const custom_error_1 = require("../utils/custom.error");
const http_response_1 = require("../constant/http.response");
const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.UNAUTHORIZED, http_response_1.HttpRes.message.UNAUTHORIZED, 'Access token is required');
        }
        const token = authHeader.substring(7);
        if (!token || token === 'null' || token === 'undefined') {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.UNAUTHORIZED, http_response_1.HttpRes.message.UNAUTHORIZED, 'Access token is required');
        }
        const decodedToken = jsonwebtoken_1.default.verify(token, env_1.default.JWT_ACCESS_SECRET);
        req.user = decodedToken;
        next();
    }
    catch (error) {
        if (error instanceof Error) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.UNAUTHORIZED, http_response_1.HttpRes.message.UNAUTHORIZED, error.message);
        }
        next(error);
    }
};
exports.verifyToken = verifyToken;
