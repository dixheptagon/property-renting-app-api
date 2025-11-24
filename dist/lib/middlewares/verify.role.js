import { CustomError } from '../utils/custom.error.js';
import { HttpRes } from '../constant/http.response.js';
import database from '../config/prisma.client.js';
// Define allowed roles enum based on Prisma schema
var UserRole;
(function (UserRole) {
    UserRole["guest"] = "guest";
    UserRole["tenant"] = "tenant";
})(UserRole || (UserRole = {}));
// Middleware to verify user role
export const verifyRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            // Check if user is authenticated (req.user should be set by verifyToken middleware)
            if (!req.user) {
                throw new CustomError(HttpRes.status.UNAUTHORIZED, HttpRes.message.UNAUTHORIZED, 'Authentication required');
            }
            // get role from user
            const user = await database.user.findUnique({
                where: { uid: req.user.uid },
                select: { role: true },
            });
            // Check if user's role is in the allowed roles
            if (!user) {
                throw new CustomError(HttpRes.status.UNAUTHORIZED, HttpRes.message.UNAUTHORIZED, 'User not found');
            }
            if (!allowedRoles.includes(user.role)) {
                throw new CustomError(HttpRes.status.FORBIDDEN, HttpRes.message.FORBIDDEN, `Access denied. Required roles: ${allowedRoles.join(', ')}`);
            }
            // User has the required role, proceed to next middleware
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
// Convenience middleware functions for specific roles
export const verifyTenant = verifyRole([UserRole.tenant]);
export const verifyGuest = verifyRole([UserRole.guest]);
export const verifyTenantOrGuest = verifyRole([
    UserRole.tenant,
    UserRole.guest,
]);
