import { CustomError } from '../utils/custom.error.js';
import { HttpRes } from '../constant/http.response.js';
export const dummyUserMiddleware = (req, res, next) => {
    const userHeader = req.headers['x-user'];
    if (userHeader) {
        try {
            req.user = JSON.parse(userHeader);
        }
        catch (err) {
            throw new CustomError(HttpRes.status.BAD_REQUEST, HttpRes.message.BAD_REQUEST, 'Invalid user header');
        }
    }
    next();
};
