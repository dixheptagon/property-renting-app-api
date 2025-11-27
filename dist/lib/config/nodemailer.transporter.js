import nodemailer from 'nodemailer';
import env from '../../env.js';
// Create a test account or replace with real credentials.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: env.NODEMAILER_APP_EMAIL,
        pass: env.NODEMAILER_APP_PASSWORD,
    },
});
export default transporter;
