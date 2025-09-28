import * as Yup from 'yup';

export const VerifyEmailSchema = Yup.object()
  .shape({
    email: Yup.string().email('Invalid email').required('Email is required'),

    verification_code: Yup.string(),

    verification_token: Yup.string(),
  })
  .test(
    'verification-or-token',
    'Either verification code or token is required',
    (value) => {
      return !!(value.verification_code || value.verification_token);
    },
  );
