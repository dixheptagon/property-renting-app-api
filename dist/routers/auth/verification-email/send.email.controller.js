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
exports.SendEmailVerificationController = void 0;
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const handlebars_1 = __importDefault(require("handlebars"));
const nodemailer_transporter_1 = __importDefault(require("../../../lib/config/nodemailer.transporter"));
const custom_error_1 = require("../../../lib/utils/custom.error");
const http_response_1 = require("../../../lib/constant/http.response");
const response_handler_1 = require("../../../lib/utils/response.handler");
const prisma_client_1 = __importDefault(require("../../../lib/config/prisma.client"));
const send_email_validation_1 = require("./send.email.validation");
const SendEmailVerificationController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = yield send_email_validation_1.SendEmailVerificationSchema.validate(req.body, {
            abortEarly: false,
        });
        // Check if email already exists and verified
        const existingUser = yield prisma_client_1.default.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                is_verified: true,
                first_name: true,
                last_name: true,
            },
        });
        if (existingUser && existingUser.is_verified) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.CONFLICT, http_response_1.HttpRes.message.CONFLICT, 'Email already registered and verified. Please login.');
        }
        // Generate verification code (6 digits)
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        // Generate verification token
        const verificationToken = crypto_1.default.randomBytes(32).toString('hex');
        // Expiry in 15 minutes for email verification
        const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000);
        // convert to Locale for casting
        const expireTimeStamp = verificationExpiry.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
        // Store or update email verification data
        yield prisma_client_1.default.emailVerification.upsert({
            where: { email },
            update: {
                verification_code: verificationCode,
                verification_token: verificationToken,
                expires_at: verificationExpiry,
                is_used: false,
                used_at: null,
            },
            create: {
                email,
                verification_code: verificationCode,
                verification_token: verificationToken,
                expires_at: verificationExpiry,
                is_used: false,
                used_at: null,
            },
        });
        // Create verification link ( NEED TO CHANGE )
        // const verificationLink = `http://localhost:8000/verify-email?verification_token=${verificationToken}`;
        const verificationLink = `${process.env.ACTIVATION_ACCOUNT_URL}?verification_token=${verificationToken}`;
        // Generate timestamp
        const currentTimestamp = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
        // Send email verification
        const templateHtmlDir = path_1.default.resolve(__dirname, '../../../lib/template');
        const templateHtmlFile = 'account.activation.html';
        const templateHtmlPath = path_1.default.join(templateHtmlDir, templateHtmlFile);
        const templateHtml = fs_1.default.readFileSync(templateHtmlPath, 'utf-8');
        const compiledTemplate = handlebars_1.default.compile(templateHtml);
        const htmlToSend = compiledTemplate({
            email: email,
            verification_code: verificationCode,
            verification_link: verificationLink,
            expire_minutes: 15,
            expire_timestamp: expireTimeStamp,
            email_timestamp: currentTimestamp,
            current_year: new Date().getFullYear(),
        });
        yield nodemailer_transporter_1.default.sendMail({
            from: 'Staysia <admin@gmail.com>',
            to: email,
            subject: 'Email Verification - staysia.id',
            html: htmlToSend,
        });
        res.status(http_response_1.HttpRes.status.OK).json(response_handler_1.ResponseHandler.success('Verification code sent to your email. Please check your inbox.', {
            email: email,
            expiresIn: '15 minutes',
        }));
    }
    catch (error) {
        next(error);
    }
});
exports.SendEmailVerificationController = SendEmailVerificationController;
