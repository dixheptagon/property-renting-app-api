import jwt from 'jsonwebtoken';
import env from '../../env.js';
import { CustomError } from '../utils/custom.error.js';
import { HttpRes } from '../constant/http.response.js';
export const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new CustomError(HttpRes.status.UNAUTHORIZED, HttpRes.message.UNAUTHORIZED, 'Access token is required');
        }
        const token = authHeader.substring(7);
        if (!token || token === 'null' || token === 'undefined') {
            throw new CustomError(HttpRes.status.UNAUTHORIZED, HttpRes.message.UNAUTHORIZED, 'Access token is required');
        }
        const decodedToken = jwt.verify(token, env.JWT_ACCESS_SECRET);
        req.user = decodedToken;
        next();
    }
    catch (error) {
        if (error instanceof Error) {
            throw new CustomError(HttpRes.status.UNAUTHORIZED, HttpRes.message.UNAUTHORIZED, error.message);
        }
        next(error);
    }
};
