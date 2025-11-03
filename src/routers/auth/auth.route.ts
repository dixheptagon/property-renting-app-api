import { Router } from 'express';
import { RegisterController } from './register/register.controller';
import { CheckEmailController } from './verification-email/check.email.controller';
import { SendEmailVerificationController } from './verification-email/send.email.controller';
import { ResendVerificationController } from './resend-verification/resend.verification.controller';
import { VerifyEmailController } from './verification-email/verify.email.controller';
import { LoginController } from './login/login.controller';
import { SocialLoginController } from './login/social.login.controller';
import { RefreshTokenController } from './refresh-token/refresh.token.controller';
import { GetTenantProfileController } from './tenant-profile/get.tenant.profile.controller';
import { TenantVerificationController } from './tenant-profile/tenant.verification.controller';
import { uploadTenantProfileDocument } from '../../lib/middlewares/upload.multer';
import { verifyToken } from '../../lib/middlewares/verify.token';

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
