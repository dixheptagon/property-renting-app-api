import * as Yup from 'yup';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { CustomError } from '../utils/custom.error.js';
import { ResponseHandler } from '../utils/response.handler.js';
import { HttpRes } from '../constant/http.response.js';
// Error handler middleware
export const errorMiddleware = (err, req, res, next) => {
    // log the error (you can use a logging library here)
    console.error('Error occurred:', err);
    // check if the error is a Yup validation error
    if (err instanceof Yup.ValidationError) {
        return res
            .status(HttpRes.status.BAD_REQUEST)
            .json(ResponseHandler.error(HttpRes.message.BAD_REQUEST, err.errors));
    }
    // check if error is Prisma error
    if (err instanceof PrismaClientKnownRequestError) {
        return res
            .status(HttpRes.status.BAD_REQUEST)
            .json(ResponseHandler.error(HttpRes.message.BAD_REQUEST, err.message));
    }
    // handle other types of errors
    if (err instanceof CustomError) {
        return res
            .status(err.status)
            .json(ResponseHandler.error(err.message, err.details));
    }
    // handle unexpected errors
    return res
        .status(500)
        .json(ResponseHandler.error(HttpRes.message.INTERNAL_SERVER_ERROR, `An internal server error occurred ` + `: ${err.message}` ||
        'Unknown error'));
};
