import { Router } from 'express';
import { RegisterController } from './register/register.controller';
import { CheckEmailController } from './verification-email/check.email.controller';
import { SendEmailVerificationController } from './verification-email/send.email.controller';
import { ResendVerificationController } from './resend-verification/resend.verification.controller';
import { VerifyEmailController } from './verification-email/verify.email.controller';
import { TenantRegisterController } from './register/tenant.register.controller';

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
authRouter.post('/auth/tenant-register', TenantRegisterController);

export default authRouter;
