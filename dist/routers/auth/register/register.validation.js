import { UserRole } from '@prisma/client';
import * as Yup from 'yup';
export const RegisterSchema = Yup.object().shape({
    first_name: Yup.string()
        .required('First name is required')
        .min(3, 'First name must be at least 3 characters')
        .matches(/^[A-Za-z]+$/, 'Only alphabets allowed (A-Z)'),
    last_name: Yup.string()
        .required('Last name is required')
        .min(3, 'Last name must be at least 3 characters')
        .matches(/^[A-Za-z]+$/, 'Only alphabets allowed (A-Z)'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    password: Yup.string()
        .required('Password is required')
        .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, 'Password must be at least 8 characters long and contain at least one letter and one number'),
    role: Yup.mixed()
        .oneOf([UserRole.guest, UserRole.tenant], 'Invalid role')
        .optional(),
});
