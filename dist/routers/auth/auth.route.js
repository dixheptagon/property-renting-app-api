"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const register_controller_1 = require("./register/register.controller");
const check_email_controller_1 = require("./verification-email/check.email.controller");
const send_email_controller_1 = require("./verification-email/send.email.controller");
const resend_verification_controller_1 = require("./resend-verification/resend.verification.controller");
const verify_email_controller_1 = require("./verification-email/verify.email.controller");
const login_controller_1 = require("./login/login.controller");
const social_login_controller_1 = require("./login/social.login.controller");
const refresh_token_controller_1 = require("./refresh-token/refresh.token.controller");
const get_tenant_profile_controller_1 = require("./tenant-profile/get.tenant.profile.controller");
const tenant_verification_controller_1 = require("./tenant-profile/tenant.verification.controller");
const upload_multer_1 = require("../../lib/middlewares/upload.multer");
const verify_token_1 = require("../../lib/middlewares/verify.token");
const authRouter = (0, express_1.Router)();
// Step 1: Check if email exists
authRouter.post('/auth/check-email', check_email_controller_1.CheckEmailController);
// Step 2: Send email verification code
authRouter.post('/auth/send-verification', send_email_controller_1.SendEmailVerificationController);
// Step 2b: Resend verification code (with rate limiting)
authRouter.post('/auth/resend-verification', resend_verification_controller_1.ResendVerificationController);
// Step 3: Verify email with code or token
authRouter.post('/auth/verify-email', verify_email_controller_1.VerifyEmailController);
// Step 4: Complete registration after email verification
authRouter.post('/auth/register', register_controller_1.RegisterController);
// Step 5a: Login
authRouter.post('/auth/login', login_controller_1.LoginController);
// Step 5b: Social Login
authRouter.post('/auth/social-login', social_login_controller_1.SocialLoginController);
// step 6: Refresh token
authRouter.post('/auth/refresh-token', refresh_token_controller_1.RefreshTokenController);
// Tenant Profile routes
// Get Tenant Profile
authRouter.get('/auth/tenant-profile', verify_token_1.verifyToken, get_tenant_profile_controller_1.GetTenantProfileController);
// Tenant Verification
authRouter.post('/auth/tenant-profile/verification', verify_token_1.verifyToken, (0, upload_multer_1.uploadTenantProfileDocument)().single('government_id_file'), tenant_verification_controller_1.TenantVerificationController);
exports.default = authRouter;
