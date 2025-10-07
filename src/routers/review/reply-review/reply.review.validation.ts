import * as Yup from 'yup';

export const ReplyReviewSchema = Yup.object().shape({
  reply_comment: Yup.string()
    .required('Reply comment is required')
    .min(10, 'Reply comment must be at least 10 characters')
    .max(1000, 'Reply comment must not exceed 1000 characters'),
});
