"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckEmailController = void 0;
const prisma_client_1 = __importDefault(require("../../../lib/config/prisma.client"));
const http_response_1 = require("../../../lib/constant/http.response");
const response_handler_1 = require("../../../lib/utils/response.handler");
const check_email_validation_1 = require("./check.email.validation");
const CheckEmailController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = yield check_email_validation_1.CheckEmailSchema.validate(req.body, {
            abortEarly: false,
        });
        // Check if user already exists
        const existingUser = yield prisma_client_1.default.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                is_verified: true,
                first_name: true,
                last_name: true,
            },
        });
        if (existingUser) {
            return res.status(http_response_1.HttpRes.status.OK).json(response_handler_1.ResponseHandler.success(http_response_1.HttpRes.message.CONFLICT +
                ' Email already exists, Please login to continue.', {
                exists: true,
                email: email,
                canProceed: false,
            }));
        }
        // Email available for registration
        return res.status(http_response_1.HttpRes.status.OK).json(response_handler_1.ResponseHandler.success(http_response_1.HttpRes.message.OK + ': Email available for registration.', {
            exists: false,
            email: email,
            canProceed: true,
        }));
    }
    catch (error) {
        next(error);
    }
});
exports.CheckEmailController = CheckEmailController;
