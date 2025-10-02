import * as Yup from 'yup';

export const CancelOrderSchema = Yup.object().shape({
  cancellation_reason: Yup.string().required('Cancellation reason is required'),
});
