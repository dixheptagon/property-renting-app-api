"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const Yup = __importStar(require("yup"));
const library_1 = require("@prisma/client/runtime/library");
const custom_error_1 = require("../utils/custom.error");
const response_handler_1 = require("../utils/response.handler");
const http_response_1 = require("../constant/http.response");
// Error handler middleware
const errorMiddleware = (err, req, res, next) => {
    // log the error (you can use a logging library here)
    console.error('Error occurred:', err);
    // check if the error is a Yup validation error
    if (err instanceof Yup.ValidationError) {
        return res
            .status(http_response_1.HttpRes.status.BAD_REQUEST)
            .json(response_handler_1.ResponseHandler.error(http_response_1.HttpRes.message.BAD_REQUEST, err.errors));
    }
    // check if error is Prisma error
    if (err instanceof library_1.PrismaClientKnownRequestError) {
        return res
            .status(http_response_1.HttpRes.status.BAD_REQUEST)
            .json(response_handler_1.ResponseHandler.error(http_response_1.HttpRes.message.BAD_REQUEST, err.message));
    }
    // handle other types of errors
    if (err instanceof custom_error_1.CustomError) {
        return res
            .status(err.status)
            .json(response_handler_1.ResponseHandler.error(err.message, err.details));
    }
    // handle unexpected errors
    return res
        .status(500)
        .json(response_handler_1.ResponseHandler.error(http_response_1.HttpRes.message.INTERNAL_SERVER_ERROR, `An internal server error occurred ` + `: ${err.message}` ||
        'Unknown error'));
};
exports.errorMiddleware = errorMiddleware;
