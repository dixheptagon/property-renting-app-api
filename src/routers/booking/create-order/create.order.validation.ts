import * as Yup from 'yup';

export const CreateOrderSchema = Yup.object().shape({
  user_id: Yup.number().required('User ID is required'),
  room_id: Yup.number().required('Room ID is required'),
  property_id: Yup.number().required('Property ID is required'),
  check_in_date: Yup.date()
    .required('Check-in date is required')
    .min(new Date(), 'Check-in date cannot be in the past'),
  check_out_date: Yup.date()
    .required('Check-out date is required')
    .min(
      Yup.ref('check_in_date'),
      'Check-out date must be after check-in date',
    ),
  fullname: Yup.string()
    .required('Full name is required')
    .matches(/^[a-zA-Z\s]+$/, 'Full name must only contain letters')
    .min(3, 'Full name is too short'),
  email: Yup.string()
    .email('Invalid email')
    .required('Email is required')
    .max(50, 'Email is too long'),
  phone_number: Yup.string()
    .required('Phone number is required')
    .matches(/^[0-9]+$/, 'Phone number must only contain digits')
    .min(9, 'Phone number is too short')
    .max(20, 'Phone number is too long'),
});
