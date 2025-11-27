import * as Yup from 'yup';

export const VerifyOtpSchema = Yup.object({
  email: Yup.string().email().required(),
  verification_code: Yup.string().length(6).required(),
});

export const VerifyTokenSchema = Yup.object({
  verification_token: Yup.string().required(),
});
