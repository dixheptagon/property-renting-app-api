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
exports.propertyImageUploadController = void 0;
const cloudinary_1 = require("../../../../lib/config/cloudinary");
const response_handler_1 = require("../../../../lib/utils/response.handler");
const http_response_1 = require("../../../../lib/constant/http.response");
const custom_error_1 = require("../../../../lib/utils/custom.error");
const prisma_client_1 = __importDefault(require("../../../../lib/config/prisma.client"));
const propertyImageUploadController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const uploadedPublicIds = [];
    try {
        const files = req.files;
        let { temp_group_id } = req.body;
        if (!files || files.length === 0) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'No files uploaded');
        }
        // Generate temp_group_id if not provided
        if (!temp_group_id) {
            temp_group_id = crypto.randomUUID();
        }
        else if (typeof temp_group_id !== 'string') {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'temp_group_id must be a string');
        }
        const totalImages = yield prisma_client_1.default.propertyImage.count({
            where: { temp_group_id },
        });
        if (totalImages >= 10) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, `You have already uploaded ${totalImages} images, you can only upload a maximum of 10 images per property`);
        }
        // Use Prisma transaction for atomic operations
        const uploadResults = yield prisma_client_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const results = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                // Validate MIME type
                const allowedMimes = [
                    'image/jpeg',
                    'image/png',
                    'image/jpg',
                    'image/webp',
                    'image/avif',
                ];
                if (!allowedMimes.includes(file.mimetype)) {
                    throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, `Invalid file type: ${file.mimetype}. Only JPEG, PNG, JPG, AVIF, and WebP are allowed.`);
                }
                // Validate file size (3MB max)
                if (file.size > 2 * 1024 * 1024) {
                    throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'File size must be less than 2MB');
                }
                // Generate UUID for public_id
                const uuid = crypto.randomUUID();
                const publicId = uuid;
                // Upload to Cloudinary with custom public_id
                const uploadResult = (yield (0, cloudinary_1.cloudinaryUploadTempPropertyImage)(file.buffer, { public_id: publicId, temp_group_id }));
                // Track uploaded public IDs for cleanup on failure
                uploadedPublicIds.push(uploadResult.public_id);
                // Check if there's already a main image for this temp_group_id
                const existingMainImage = yield tx.propertyImage.findFirst({
                    where: {
                        temp_group_id,
                        is_main: true,
                    },
                });
                // Set is_main: true only if no existing main image
                const isMain = !existingMainImage;
                // Save to database with status 'temp'
                const propertyImage = yield tx.propertyImage.create({
                    data: {
                        url: uploadResult.secure_url,
                        is_main: isMain,
                        order_index: i,
                        status: 'temp',
                        temp_group_id: temp_group_id || null,
                    },
                });
                results.push({
                    id: propertyImage.id,
                    publicId: uploadResult.public_id,
                    secureUrl: uploadResult.secure_url,
                    isMain: propertyImage.is_main,
                    orderIndex: propertyImage.order_index,
                    status: propertyImage.status,
                    tempGroupId: propertyImage.temp_group_id,
                });
            }
            return results;
        }), { timeout: 60 * 1000 });
        res
            .status(http_response_1.HttpRes.status.CREATED)
            .json(response_handler_1.ResponseHandler.success('Images uploaded successfully', uploadResults));
    }
    catch (error) {
        // Cleanup uploaded Cloudinary images on failure
        if (uploadedPublicIds.length > 0) {
            try {
                yield Promise.allSettled(uploadedPublicIds.map((publicId) => (0, cloudinary_1.cloudinaryDeleteTempPropertyImage)(publicId)));
            }
            catch (cleanupError) {
                // Log cleanup error but don't override original error
                console.error('Failed to cleanup Cloudinary images:', cleanupError);
            }
        }
        next(error);
    }
});
exports.propertyImageUploadController = propertyImageUploadController;
