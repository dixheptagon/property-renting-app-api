import * as Yup from 'yup';
export const CreateReviewSchema = Yup.object().shape({
    comment: Yup.string()
        .min(10, 'Please write at least 10 characters')
        .max(500, 'Maximum 500 characters allowed')
        .required('Experience is required'),
    rating: Yup.number()
        .required('Rating is required')
        .min(1, 'Rating must be at least 1')
        .max(5, 'Rating must not exceed 5'),
});
