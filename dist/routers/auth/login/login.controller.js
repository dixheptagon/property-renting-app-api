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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginController = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = __importDefault(require("../../../env"));
const login_validation_1 = require("./login.validation");
const prisma_client_1 = __importDefault(require("../../../lib/config/prisma.client"));
const custom_error_1 = require("../../../lib/utils/custom.error");
const http_response_1 = require("../../../lib/constant/http.response");
const response_handler_1 = require("../../../lib/utils/response.handler");
const LoginController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validate request body
        const { email, password } = yield login_validation_1.LoginSchema.validate(req.body, {
            abortEarly: false,
        });
        // Find user by email
        const user = yield prisma_client_1.default.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.UNAUTHORIZED, http_response_1.HttpRes.message.UNAUTHORIZED, 'Invalid email or password');
        }
        // Check if password exists (for OAuth users, password might be null)
        if (!user.password) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.UNAUTHORIZED, http_response_1.HttpRes.message.UNAUTHORIZED, 'Invalid email or password');
        }
        // Compare password
        const isPasswordValid = yield bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.UNAUTHORIZED, http_response_1.HttpRes.message.UNAUTHORIZED, 'Invalid email or password');
        }
        // Create JWT token
        const accessToken = jsonwebtoken_1.default.sign({ uid: user.uid, email: user.email, role: user.role }, env_1.default.JWT_ACCESS_SECRET, { expiresIn: '15m' });
        // Create refresh token
        const refreshToken = jsonwebtoken_1.default.sign({ uid: user.uid, email: user.email, role: user.role }, env_1.default.JWT_REFRESH_SECRET, { expiresIn: '7d' });
        // Store refresh token in database
        yield prisma_client_1.default.user.update({
            where: { id: user.id },
            data: { refresh_token: refreshToken },
        });
        // Send refresh token via HTTP-Only cookie
        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days EXP
        });
        // Prepare user data excluding password and refresh_token
        const { password: _, refresh_token } = user, userData = __rest(user, ["password", "refresh_token"]);
        return res.status(http_response_1.HttpRes.status.OK).json(response_handler_1.ResponseHandler.success('Login successful', {
            user: userData,
            access_token: accessToken,
        }));
    }
    catch (error) {
        next(error);
    }
});
exports.LoginController = LoginController;
