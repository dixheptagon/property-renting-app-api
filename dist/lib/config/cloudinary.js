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
exports.cloudinaryUploadTenantProfileDocument = exports.cloudinaryMoveImage = exports.cloudinaryDeleteTempPropertyImage = exports.cloudinaryUploadTempPropertyImage = exports.cloudinaryUploadPaymentProof = void 0;
const cloudinary_1 = require("cloudinary");
const env_1 = __importDefault(require("../../env"));
const custom_error_1 = require("../utils/custom.error");
const http_response_1 = require("../constant/http.response");
cloudinary_1.v2.config({
    cloud_name: env_1.default.CLOUD_NAME,
    api_key: env_1.default.CLOUD_API_KEY,
    api_secret: env_1.default.CLOUD_API_SECRET,
});
const cloudinaryUploadPaymentProof = (file) => {
    return new Promise((resolve, reject) => {
        cloudinary_1.v2.uploader
            .upload_stream({
            folder: env_1.default.CLOUD_PAYMENT_PROOF_FOLDER_PATH, // 👈 folder Cloudinary for payment proof
        }, (error, uploadResult) => {
            if (error) {
                return reject(error);
            }
            return resolve(uploadResult);
        })
            .end(file);
    });
};
exports.cloudinaryUploadPaymentProof = cloudinaryUploadPaymentProof;
const cloudinaryUploadTempPropertyImage = (file, options = {}) => {
    return new Promise((resolve, reject) => {
        cloudinary_1.v2.uploader
            .upload_stream(Object.assign({ folder: `${env_1.default.CLOUD_TEMP_PROPERTIES_IMAGE_FOLDER_PATH}/${options.temp_group_id}` }, options), (error, uploadResult) => {
            if (error) {
                return reject(error);
            }
            return resolve(uploadResult);
        })
            .end(file);
    });
};
exports.cloudinaryUploadTempPropertyImage = cloudinaryUploadTempPropertyImage;
const cloudinaryDeleteTempPropertyImage = (publicId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Prepare File Path to Delete
        const result = yield cloudinary_1.v2.uploader.destroy(publicId, {
            resource_type: 'image',
        });
        return result;
    }
    catch (error) {
        throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Failed to delete property image');
    }
});
exports.cloudinaryDeleteTempPropertyImage = cloudinaryDeleteTempPropertyImage;
const cloudinaryMoveImage = (fromPublicId, toPublicId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Rename the image to move it to a new folder
        const result = yield cloudinary_1.v2.uploader.rename(fromPublicId, toPublicId, {
            overwrite: true,
        });
        return result;
    }
    catch (error) {
        throw new custom_error_1.CustomError(http_response_1.HttpRes.status.INTERNAL_SERVER_ERROR, http_response_1.HttpRes.message.INTERNAL_SERVER_ERROR, 'Failed to move image in Cloudinary');
    }
});
exports.cloudinaryMoveImage = cloudinaryMoveImage;
const cloudinaryUploadTenantProfileDocument = (file) => {
    return new Promise((resolve, reject) => {
        cloudinary_1.v2.uploader
            .upload_stream({
            folder: env_1.default.CLOUD_TENANT_PROFILE_FOLDER_PATH, // 👈 folder Cloudinary for tenant profile documents
            resource_type: 'image', // for image files (JPEG, PNG, JPG, AVIF, WebP)
        }, (error, uploadResult) => {
            if (error) {
                return reject(error);
            }
            return resolve(uploadResult);
        })
            .end(file);
    });
};
exports.cloudinaryUploadTenantProfileDocument = cloudinaryUploadTenantProfileDocument;
