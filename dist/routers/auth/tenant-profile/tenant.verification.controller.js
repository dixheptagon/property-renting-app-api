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
exports.TenantVerificationController = void 0;
const prisma_client_1 = __importDefault(require("../../../lib/config/prisma.client"));
const response_handler_1 = require("../../../lib/utils/response.handler");
const http_response_1 = require("../../../lib/constant/http.response");
const cloudinary_1 = require("../../../lib/config/cloudinary");
const custom_error_1 = require("../../../lib/utils/custom.error");
const tenant_verification_validation_1 = require("./tenant.verification.validation");
const send_email_tenant_verified_1 = require("./send.email.tenant.verified");
const TenantVerificationController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        if (!userId) {
            return res
                .status(http_response_1.HttpRes.status.UNAUTHORIZED)
                .json(response_handler_1.ResponseHandler.error('Unauthorized', 'User not authenticated'));
        }
        const { contact, address, city, country, government_id_type } = req.body;
        const file = req.file;
        // Validate request body
        try {
            yield tenant_verification_validation_1.TenantVerificationSchema.validate({
                contact,
                address,
                city,
                country,
                government_id_type,
            });
        }
        catch (validationError) {
            return res
                .status(http_response_1.HttpRes.status.UNPROCESSABLE_ENTITY)
                .json(response_handler_1.ResponseHandler.error('Validation Error', validationError.errors));
        }
        if (!file) {
            return res
                .status(http_response_1.HttpRes.status.BAD_REQUEST)
                .json(response_handler_1.ResponseHandler.error('Validation Error', 'Government ID file is required'));
        }
        // Upload file to Cloudinary
        let uploadResult;
        try {
            uploadResult = yield (0, cloudinary_1.cloudinaryUploadTenantProfileDocument)(file.buffer);
        }
        catch (uploadError) {
            console.error('Cloudinary upload error:', uploadError);
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.INTERNAL_SERVER_ERROR, http_response_1.HttpRes.message.INTERNAL_SERVER_ERROR, 'Failed to upload government ID document');
        }
        // find user by UId (outside transaction for email access)
        const user = yield prisma_client_1.default.user.findUnique({
            where: { uid: userId },
            select: { role: true, id: true, email: true },
        });
        if (!user) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.UNAUTHORIZED, http_response_1.HttpRes.message.UNAUTHORIZED, 'User not found');
        }
        // Use transaction to ensure data consistency
        const result = yield prisma_client_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Create or update tenant profile
            const tenantProfile = yield tx.tenantProfile.upsert({
                where: {
                    user_id: user.id,
                },
                update: {
                    contact,
                    address,
                    city,
                    country,
                    government_id_type,
                    government_id_path: uploadResult.secure_url,
                    verified: true, // Reset verification status when new document is uploaded
                    verified_at: null,
                    updated_at: new Date(),
                },
                create: {
                    user_id: user.id,
                    contact,
                    address,
                    city,
                    country,
                    government_id_type,
                    government_id_path: uploadResult.secure_url,
                    verified: true, // Set verification status to true when document is uploaded for the first time
                    balance: 0,
                },
            });
            // update user role to tenant
            yield tx.user.update({
                where: { uid: userId },
                data: { role: 'tenant' },
            });
            return tenantProfile;
        }));
        // Send verification success email (outside transaction to avoid email failure breaking the transaction)
        try {
            yield (0, send_email_tenant_verified_1.sendTenantVerifiedEmail)({
                email: user.email,
                userId: userId,
                tenantProfileId: result.id,
            });
        }
        catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // Don't throw error - email failure shouldn't break the verification process
        }
        // Response
        const response = {
            tenantProfile: {
                id: result.id,
                user_id: result.user_id,
                contact: result.contact,
                address: result.address,
                city: result.city,
                country: result.country,
                government_id_type: result.government_id_type,
                government_id_path: result.government_id_path,
                verified: result.verified,
                created_at: result.created_at,
                updated_at: result.updated_at,
            },
            user: {
                id: user.id,
                role: user.role,
                email: user.email,
            },
        };
        return res
            .status(http_response_1.HttpRes.status.OK)
            .json(response_handler_1.ResponseHandler.success('Verification submitted successfully', response));
    }
    catch (error) {
        next(error);
    }
});
exports.TenantVerificationController = TenantVerificationController;
