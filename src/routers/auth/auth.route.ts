import { Router } from 'express';
import { RegisterController } from './register/register.controller.js';
import { CheckEmailController } from './verification-email/check.email.controller.js';
import { SendEmailVerificationController } from './verification-email/send.email.controller.js';
import { ResendVerificationController } from './resend-verification/resend.verification.controller.js';
import { VerifyEmailController } from './verification-email/verify.email.controller.js';
import { LoginController } from './login/login.controller.js';
import { SocialLoginController } from './login/social.login.controller.js';
import { RefreshTokenController } from './refresh-token/refresh.token.controller.js';
import { GetTenantProfileController } from './tenant-profile/get.tenant.profile.controller.js';
import { TenantVerificationController } from './tenant-profile/tenant.verification.controller.js';
import { uploadTenantProfileDocument } from '../../lib/middlewares/upload.multer.js';
import { verifyToken } from '../../lib/middlewares/verify.token.js';

const authRouter = Router();

// Step 1: Check if email exists
authRouter.post('/auth/check-email', CheckEmailController);

// Step 2: Send email verification code
authRouter.post('/auth/send-verification', SendEmailVerificationController);

// Step 2b: Resend verification code (with rate limiting)
authRouter.post('/auth/resend-verification', ResendVerificationController);

// Step 3: Verify email with code or token
authRouter.post('/auth/verify-email', VerifyEmailController);

// Step 4: Complete registration after email verification
authRouter.post('/auth/register', RegisterController);

// Step 5a: Login
authRouter.post('/auth/login', LoginController);

// Step 5b: Social Login
authRouter.post('/auth/social-login', SocialLoginController);

// step 6: Refresh token
authRouter.post('/auth/refresh-token', RefreshTokenController);

// Tenant Profile routes

// Get Tenant Profile
authRouter.get('/auth/tenant-profile', verifyToken, GetTenantProfileController);

// Tenant Verification
authRouter.post(
  '/auth/tenant-profile/verification',
  verifyToken,
  uploadTenantProfileDocument().single('government_id_file'),
  TenantVerificationController,
);

export default authRouter;
