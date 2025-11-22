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
exports.ResendVerificationController = void 0;
const resend_verification_validation_1 = require("./resend.verification.validation");
const prisma_client_1 = __importDefault(require("../../../lib/config/prisma.client"));
const custom_error_1 = require("../../../lib/utils/custom.error");
const http_response_1 = require("../../../lib/constant/http.response");
const send_email_controller_1 = require("../verification-email/send.email.controller");
const ResendVerificationController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = yield resend_verification_validation_1.ResendVerificationSchema.validate(req.body, {
            abortEarly: false,
        });
        // Check if there's a recent verification request (rate limiting)
        const recentVerification = yield prisma_client_1.default.emailVerification.findFirst({
            where: {
                email,
                updated_at: {
                    gte: new Date(Date.now() - 1 * 60 * 1000), // 1 minute ago
                },
            },
        });
        if (recentVerification) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.TOO_MANY_REQUESTS, http_response_1.HttpRes.message.TOO_MANY_REQUESTS, 'Please wait 1 minute before requesting a new verification code');
        }
        // Use the same logic as SendEmailVerificationController
        yield (0, send_email_controller_1.SendEmailVerificationController)(req, res, next);
    }
    catch (error) {
        next(error);
    }
});
exports.ResendVerificationController = ResendVerificationController;
