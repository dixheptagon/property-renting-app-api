"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseHandler = void 0;
class ResponseHandler {
    constructor(success, message, data, error) {
        this.success = success;
        this.message = message;
        if (success) {
            if (data !== undefined) {
                this.data = data;
            }
        }
        else {
            if (error !== undefined) {
                this.error = error;
            }
        }
    }
    static success(message, data) {
        return new ResponseHandler(true, message, data);
    }
    static error(message, error) {
        return new ResponseHandler(false, message, undefined, error);
    }
}
exports.ResponseHandler = ResponseHandler;
