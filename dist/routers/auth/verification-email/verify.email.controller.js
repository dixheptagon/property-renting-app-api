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
exports.VerifyEmailController = void 0;
const custom_error_1 = require("../../../lib/utils/custom.error");
const http_response_1 = require("../../../lib/constant/http.response");
const verify_email_validation_1 = require("./verify.email.validation");
const prisma_client_1 = __importDefault(require("../../../lib/config/prisma.client"));
const response_handler_1 = require("../../../lib/utils/response.handler");
const VerifyEmailController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let whereClause = { is_used: false, used_at: null };
        let email;
        // cek kalau ada token di query → link verification
        if (req.query.verification_token) {
            const { verification_token } = yield verify_email_validation_1.VerifyTokenSchema.validate(req.query, { abortEarly: false });
            whereClause.verification_token = verification_token;
        }
        else {
            // kalau OTP, ambil dari body
            const { email: bodyEmail, verification_code } = yield verify_email_validation_1.VerifyOtpSchema.validate(req.body, { abortEarly: false });
            email = bodyEmail;
            whereClause.email = bodyEmail;
            whereClause.verification_code = verification_code;
        }
        const emailVerification = yield prisma_client_1.default.emailVerification.findFirst({
            where: whereClause,
        });
        if (!emailVerification) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Invalid or expired verification code/ verification token');
        }
        // Check if expired
        if (!emailVerification.expires_at ||
            emailVerification.expires_at < new Date()) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Verification code has expired. Please request a new one.');
        }
        // Mark as used
        yield prisma_client_1.default.emailVerification.update({
            where: { id: emailVerification.id },
            data: { is_used: true, used_at: new Date() },
        });
        return res.status(http_response_1.HttpRes.status.OK).json(response_handler_1.ResponseHandler.success('Email verified successfully. Please complete your registration.', {
            email: email !== null && email !== void 0 ? email : emailVerification.email, // if using OTP give email, if using link get email from database
            verified: true,
            canProceedToRegister: true,
        }));
    }
    catch (error) {
        next(error);
    }
});
exports.VerifyEmailController = VerifyEmailController;
