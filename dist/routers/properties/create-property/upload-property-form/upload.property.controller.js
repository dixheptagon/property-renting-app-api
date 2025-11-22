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
exports.uploadPropertyController = void 0;
const upload_property_validation_1 = require("./upload.property.validation");
const upload_property_service_1 = require("./upload.property.service");
const send_email_upload_successfull_1 = require("./send.email.upload.successfull");
const send_email_upload_failed_1 = require("./send.email.upload.failed");
const response_handler_1 = require("../../../../lib/utils/response.handler");
const custom_error_1 = require("../../../../lib/utils/custom.error");
const http_response_1 = require("../../../../lib/constant/http.response");
const prisma_client_1 = __importDefault(require("../../../../lib/config/prisma.client"));
const uploadPropertyController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let propertyId = null;
    let tenantEmail = null;
    try {
        // Validate request body
        const validatedData = yield upload_property_validation_1.UploadPropertySchema.validate(req.body, {
            abortEarly: false,
        });
        // Get tenant ID from middleware
        const tenantId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        if (!tenantId) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.UNAUTHORIZED, http_response_1.HttpRes.message.UNAUTHORIZED, 'Tenant not authenticated');
        }
        // Get tenant email for notifications
        const tenant = yield prisma_client_1.default.user.findUnique({
            where: { uid: tenantId },
            select: { email: true, id: true },
        });
        if (!tenant) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.UNAUTHORIZED, http_response_1.HttpRes.message.UNAUTHORIZED, 'Tenant not found');
        }
        tenantEmail = tenant.email;
        // Call service
        const result = yield (0, upload_property_service_1.uploadPropertyService)(validatedData, tenant.id);
        propertyId = result.propertyId;
        // Send success email
        yield (0, send_email_upload_successfull_1.sendPropertyUploadSuccessEmail)({
            email: tenantEmail,
            propertyId: propertyId,
            payload: validatedData,
        });
        // Send success response
        res
            .status(http_response_1.HttpRes.status.CREATED)
            .json(response_handler_1.ResponseHandler.success(http_response_1.HttpRes.message.CREATED, result));
    }
    catch (error) {
        // Send failure email if we have tenant email
        if (tenantEmail) {
            const errorMessage = error instanceof custom_error_1.CustomError
                ? error.details || error.message
                : 'An unexpected error occurred during property upload';
            yield (0, send_email_upload_failed_1.sendPropertyUploadFailedEmail)({
                email: tenantEmail,
                errorMessage: errorMessage,
            });
        }
        next(error);
    }
});
exports.uploadPropertyController = uploadPropertyController;
