import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import env from '../../../env.js';
import { LoginSchema } from './login.validation.js';
import database from '../../../lib/config/prisma.client.js';
import { CustomError } from '../../../lib/utils/custom.error.js';
import { HttpRes } from '../../../lib/constant/http.response.js';
import { ResponseHandler } from '../../../lib/utils/response.handler.js';
export const LoginController = async (req, res, next) => {
    try {
        // Validate request body
        const { email, password } = await LoginSchema.validate(req.body, {
            abortEarly: false,
        });
        // Find user by email
        const user = await database.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new CustomError(HttpRes.status.UNAUTHORIZED, HttpRes.message.UNAUTHORIZED, 'Invalid email or password');
        }
        // Check if password exists (for OAuth users, password might be null)
        if (!user.password) {
            throw new CustomError(HttpRes.status.UNAUTHORIZED, HttpRes.message.UNAUTHORIZED, 'Invalid email or password');
        }
        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new CustomError(HttpRes.status.UNAUTHORIZED, HttpRes.message.UNAUTHORIZED, 'Invalid email or password');
        }
        // Create JWT token
        const accessToken = jwt.sign({ uid: user.uid, email: user.email, role: user.role }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
        // Create refresh token
        const refreshToken = jwt.sign({ uid: user.uid, email: user.email, role: user.role }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
        // Store refresh token in database
        await database.user.update({
            where: { id: user.id },
            data: { refresh_token: refreshToken },
        });
        // Send refresh token via HTTP-Only cookie
        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days EXP
        });
        // Prepare user data excluding password and refresh_token
        const { password: _, refresh_token, ...userData } = user;
        return res.status(HttpRes.status.OK).json(ResponseHandler.success('Login successful', {
            user: userData,
            access_token: accessToken,
        }));
    }
    catch (error) {
        next(error);
    }
};
