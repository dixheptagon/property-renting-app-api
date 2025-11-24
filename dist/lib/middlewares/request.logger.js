// Logger middleware to log request details
export const requestLogger = (req, res, next) => {
    const { method, url } = req;
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${method} request to ${url}`);
    next(); // Call next to continue to the next middleware or route handler
};
