import * as Yup from 'yup';
export const CancelOrderByTenantSchema = Yup.object().shape({
    cancellation_reason: Yup.string()
        .required('Reason is required')
        .min(10, 'Reason must be at least 10 characters long')
        .max(500, 'Reason cannot exceed 500 characters')
        .trim('Reason cannot be just whitespace')
        .matches(/^[a-zA-Z0-9\s.,!?-]+$/, 'Reason can only contain letters, numbers, spaces, and basic punctuation'),
});
