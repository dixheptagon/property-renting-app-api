"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyTenantOrGuest = exports.verifyGuest = exports.verifyTenant = exports.verifyRole = void 0;
const custom_error_1 = require("../utils/custom.error");
const http_response_1 = require("../constant/http.response");
const prisma_client_1 = __importDefault(require("../config/prisma.client"));
// Define allowed roles enum based on Prisma schema
var UserRole;
(function (UserRole) {
    UserRole["guest"] = "guest";
    UserRole["tenant"] = "tenant";
})(UserRole || (UserRole = {}));
// Middleware to verify user role
const verifyRole = (allowedRoles) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Check if user is authenticated (req.user should be set by verifyToken middleware)
            if (!req.user) {
                throw new custom_error_1.CustomError(http_response_1.HttpRes.status.UNAUTHORIZED, http_response_1.HttpRes.message.UNAUTHORIZED, 'Authentication required');
            }
            // get role from user
            const user = yield prisma_client_1.default.user.findUnique({
                where: { uid: req.user.uid },
                select: { role: true },
            });
            // Check if user's role is in the allowed roles
            if (!user) {
                throw new custom_error_1.CustomError(http_response_1.HttpRes.status.UNAUTHORIZED, http_response_1.HttpRes.message.UNAUTHORIZED, 'User not found');
            }
            if (!allowedRoles.includes(user.role)) {
                throw new custom_error_1.CustomError(http_response_1.HttpRes.status.FORBIDDEN, http_response_1.HttpRes.message.FORBIDDEN, `Access denied. Required roles: ${allowedRoles.join(', ')}`);
            }
            // User has the required role, proceed to next middleware
            next();
        }
        catch (error) {
            next(error);
        }
    });
};
exports.verifyRole = verifyRole;
// Convenience middleware functions for specific roles
exports.verifyTenant = (0, exports.verifyRole)([UserRole.tenant]);
exports.verifyGuest = (0, exports.verifyRole)([UserRole.guest]);
exports.verifyTenantOrGuest = (0, exports.verifyRole)([
    UserRole.tenant,
    UserRole.guest,
]);
