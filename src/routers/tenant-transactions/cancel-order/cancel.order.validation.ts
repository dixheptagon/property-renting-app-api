import * as Yup from 'yup';

export const CancelOrderByTenantSchema = Yup.object().shape({
  cancellationReason: Yup.string().required('Cancellation reason is required'),
});
