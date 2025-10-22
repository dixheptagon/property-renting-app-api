import * as Yup from 'yup';

export const SocialLoginSchema = Yup.object().shape({
  idToken: Yup.string().required('idToken is required'),
});
