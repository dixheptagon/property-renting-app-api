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
exports.RegisterController = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = __importDefault(require("../../../env"));
const register_validation_1 = require("./register.validation");
const prisma_client_1 = __importDefault(require("../../../lib/config/prisma.client"));
const custom_error_1 = require("../../../lib/utils/custom.error");
const http_response_1 = require("../../../lib/constant/http.response");
const response_handler_1 = require("../../../lib/utils/response.handler");
const RegisterController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validate request body
        const { first_name, last_name, email, password, role = 'guest', } = yield register_validation_1.RegisterSchema.validate(req.body, {
            abortEarly: false,
        });
        // Check if user already exists
        const existingUser = yield prisma_client_1.default.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.CONFLICT, http_response_1.HttpRes.message.CONFLICT, 'User already registered. Please login.');
        }
        // Check if email was verified
        const emailVerification = yield prisma_client_1.default.emailVerification.findFirst({
            where: {
                email,
                is_used: true,
            },
            orderBy: { created_at: 'desc' },
        });
        if (!emailVerification) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Email not verified. Please verify your email first.');
        }
        // Hash password
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        // Create user
        const transaction = yield prisma_client_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Generate UID
            const uid = crypto.randomUUID();
            // Create new user
            const user = yield tx.user.create({
                data: {
                    uid,
                    first_name,
                    last_name,
                    email,
                    password: hashedPassword,
                    role: role,
                    is_verified: true, // Already verified via email
                },
                select: {
                    id: true,
                    uid: true,
                    first_name: true,
                    last_name: true,
                    email: true,
                    role: true,
                    is_verified: true,
                },
            });
            // Clean up used verification records
            yield tx.emailVerification.deleteMany({
                where: { email },
            });
            // Create JWT token
            const accessToken = jsonwebtoken_1.default.sign({ uid: user.uid, email: user.email, role: user.role }, env_1.default.JWT_ACCESS_SECRET, { expiresIn: '15m' });
            // Create refresh token
            const refreshToken = jsonwebtoken_1.default.sign({ uid: user.uid, email: user.email, role: user.role }, env_1.default.JWT_REFRESH_SECRET, { expiresIn: '7d' });
            yield tx.user.update({
                where: { id: user.id },
                data: { refresh_token: refreshToken },
            });
            return { user, accessToken, refreshToken };
        }));
        // Send refresh token via HTTP-Only cookie
        res.cookie('refresh_token', transaction.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days EXP
        });
        const fullname = `${transaction.user.first_name} ${transaction.user.last_name}`;
        return res
            .status(http_response_1.HttpRes.status.CREATED)
            .json(response_handler_1.ResponseHandler.success(`${http_response_1.HttpRes.message.CREATED} : Registration completed successfully! Welcome ${fullname}`, { user: transaction.user, access_token: transaction.accessToken }));
    }
    catch (error) {
        next(error);
    }
});
exports.RegisterController = RegisterController;
