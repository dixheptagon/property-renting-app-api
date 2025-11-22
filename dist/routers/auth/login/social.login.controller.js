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
exports.SocialLoginController = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = __importDefault(require("../../../env"));
const prisma_client_1 = __importDefault(require("../../../lib/config/prisma.client"));
const custom_error_1 = require("../../../lib/utils/custom.error");
const http_response_1 = require("../../../lib/constant/http.response");
const response_handler_1 = require("../../../lib/utils/response.handler");
const firebase_admin_1 = __importDefault(require("../../../lib/config/firebase.admin"));
const social_login_validation_1 = require("./social.login.validation");
const SocialLoginController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { idToken } = yield social_login_validation_1.SocialLoginSchema.validate(req.body, {
            abortEarly: false,
        });
        // Verify the idToken with Firebase Admin SDK
        const decodedToken = yield firebase_admin_1.default.auth().verifyIdToken(idToken);
        // Extract required fields
        const { uid, email, name, picture } = decodedToken;
        if (!uid || !email) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Invalid token: missing uid or email');
        }
        // Split name into first name and last name
        const names = name.split(' ');
        const firstName = names[0];
        const lastName = names.slice(1).join(' ');
        // Check if user exists by uid
        let user = yield prisma_client_1.default.user.findUnique({
            where: { uid },
        });
        if (!user) {
            // Create new user
            user = yield prisma_client_1.default.user.create({
                data: {
                    uid,
                    email,
                    first_name: firstName,
                    last_name: lastName,
                    is_verified: true,
                    image: picture,
                    role: 'guest',
                },
            });
            // Create UserProvider entry
            yield prisma_client_1.default.userProvider.create({
                data: {
                    user_id: user.id,
                    provider: 'google',
                    provider_user_id: uid,
                },
            });
        }
        // Generate access token
        const accessToken = jsonwebtoken_1.default.sign({ uid: user.uid, email: user.email, role: user.role }, env_1.default.JWT_ACCESS_SECRET, { expiresIn: '15m' });
        // Generate refresh token
        const refreshToken = jsonwebtoken_1.default.sign({ uid: user.uid, email: user.email, role: user.role }, env_1.default.JWT_REFRESH_SECRET, { expiresIn: '7d' });
        // Store refresh token in database
        yield prisma_client_1.default.user.update({
            where: { id: user.id },
            data: { refresh_token: refreshToken },
        });
        // Set refresh token in HTTP-only cookie
        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        // Prepare user response data
        const { password: _, refresh_token } = user, userData = __rest(user, ["password", "refresh_token"]);
        return res.status(http_response_1.HttpRes.status.OK).json(response_handler_1.ResponseHandler.success('Social login successful', {
            access_token: accessToken,
            user: userData,
        }));
    }
    catch (error) {
        if (error instanceof custom_error_1.CustomError) {
            next(error);
        }
        else {
            next(new custom_error_1.CustomError(http_response_1.HttpRes.status.INTERNAL_SERVER_ERROR, http_response_1.HttpRes.message.INTERNAL_SERVER_ERROR, 'An error occurred during social login'));
        }
    }
});
exports.SocialLoginController = SocialLoginController;
