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
exports.RefreshTokenController = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = __importDefault(require("../../../env"));
const prisma_client_1 = __importDefault(require("../../../lib/config/prisma.client"));
const custom_error_1 = require("../../../lib/utils/custom.error");
const http_response_1 = require("../../../lib/constant/http.response");
const response_handler_1 = require("../../../lib/utils/response.handler");
const RefreshTokenController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Read refresh token from HttpOnly cookie
        const refreshToken = req.cookies.refresh_token;
        if (!refreshToken) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.UNAUTHORIZED, http_response_1.HttpRes.message.UNAUTHORIZED, 'Refresh token is required');
        }
        // Verify the refresh token
        let decodedToken;
        try {
            decodedToken = jsonwebtoken_1.default.verify(refreshToken, env_1.default.JWT_REFRESH_SECRET);
        }
        catch (error) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.UNAUTHORIZED, http_response_1.HttpRes.message.UNAUTHORIZED, 'Invalid or expired refresh token');
        }
        // Find user by uid from payload
        const user = yield prisma_client_1.default.user.findUnique({
            where: { uid: decodedToken.uid },
        });
        if (!user || user.refresh_token !== refreshToken) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.UNAUTHORIZED, http_response_1.HttpRes.message.UNAUTHORIZED, 'Invalid refresh token');
        }
        // Generate new access token
        const newAccessToken = jsonwebtoken_1.default.sign({ uid: user.uid, email: user.email, role: user.role }, env_1.default.JWT_ACCESS_SECRET, { expiresIn: '15m' });
        // Generate new refresh token
        const newRefreshToken = jsonwebtoken_1.default.sign({ uid: user.uid, email: user.email, role: user.role }, env_1.default.JWT_REFRESH_SECRET, { expiresIn: '7d' });
        // Update refresh token in database
        yield prisma_client_1.default.user.update({
            where: { id: user.id },
            data: { refresh_token: newRefreshToken },
        });
        // Send new refresh token via HTTP-Only cookie
        res.cookie('refresh_token', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        // Respond with the new access token
        return res.status(http_response_1.HttpRes.status.OK).json(response_handler_1.ResponseHandler.success('Access token refreshed successfully', {
            access_token: newAccessToken,
        }));
    }
    catch (error) {
        next(error);
    }
});
exports.RefreshTokenController = RefreshTokenController;
