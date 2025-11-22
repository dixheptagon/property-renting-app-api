"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomError = void 0;
class CustomError extends Error {
    constructor(status, message, err) {
        super(message);
        this.status = status;
        this.details = err || `An internal server error occurred.`;
    }
}
exports.CustomError = CustomError;
