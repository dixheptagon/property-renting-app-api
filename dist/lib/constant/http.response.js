export const HttpRes = Object.freeze({
    status: {
        // Success
        OK: 200,
        CREATED: 201,
        NO_CONTENT: 204,
        REDIRECT: 302,
        // Error
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        CONFLICT: 409,
        UNPROCESSABLE_ENTITY: 422,
        TOO_MANY_REQUESTS: 429,
        // Server Error
        INTERNAL_SERVER_ERROR: 500,
        SERVICE_UNAVAILABLE: 503,
    },
    message: {
        // Success
        OK: 'OK',
        CREATED: 'Created',
        NO_CONTENT: 'No Content',
        REDIRECT: 'Redirected',
        // Error
        BAD_REQUEST: 'Bad Request',
        UNAUTHORIZED: 'Unauthorized',
        FORBIDDEN: 'Forbidden',
        NOT_FOUND: 'Not Found',
        CONFLICT: 'Conflict',
        UNPROCESSABLE_ENTITY: 'Validation Error',
        TOO_MANY_REQUESTS: 'Too Many Requests',
        // Server Error
        INTERNAL_SERVER_ERROR: 'Internal Server Error',
        SERVICE_UNAVAILABLE: 'Service Unavailable',
    },
});
