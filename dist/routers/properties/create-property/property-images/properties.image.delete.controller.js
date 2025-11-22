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
exports.propertyImageDeleteController = void 0;
const response_handler_1 = require("../../../../lib/utils/response.handler");
const http_response_1 = require("../../../../lib/constant/http.response");
const custom_error_1 = require("../../../../lib/utils/custom.error");
const prisma_client_1 = __importDefault(require("../../../../lib/config/prisma.client"));
const cloudinary_1 = require("../../../../lib/config/cloudinary");
// Helper function to extract public_id from Cloudinary URL
const extractPublicIdFromUrl = (url) => {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split('/');
    const uploadIndex = pathParts.findIndex((p) => p === 'upload');
    if (uploadIndex === -1)
        throw new Error('Invalid Cloudinary URL');
    // Get everything after 'upload/' until the extension
    const pathAfterUpload = pathParts.slice(uploadIndex + 2).join('/');
    const publicIdWithExt = pathAfterUpload.split('.')[0]; // Remove extension
    return publicIdWithExt;
};
const propertyImageDeleteController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { imageId, temp_group_id } = req.params;
    try {
        // Validate that either imageId or temp_group_id is provided
        if (!imageId && !temp_group_id) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Either imageId or temp_group_id must be provided');
        }
        // Validate imageId if provided
        let id = null;
        if (imageId) {
            id = parseInt(imageId, 10);
            if (isNaN(id)) {
                throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Invalid image ID');
            }
        }
        // Validate temp_group_id if provided
        if (temp_group_id && typeof temp_group_id !== 'string') {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'temp_group_id must be a string');
        }
        // Use Prisma transaction for atomic operations
        const result = yield prisma_client_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            let imagesToDelete = [];
            let deletedImages = [];
            if (id) {
                // Single image deletion
                const image = yield tx.propertyImage.findUnique({
                    where: { id },
                });
                if (!image) {
                    throw new custom_error_1.CustomError(http_response_1.HttpRes.status.NOT_FOUND, http_response_1.HttpRes.message.NOT_FOUND, 'Image not found');
                }
                imagesToDelete = [image];
            }
            else if (temp_group_id) {
                // Group deletion by temp_group_id
                imagesToDelete = yield tx.propertyImage.findMany({
                    where: { temp_group_id },
                });
                if (imagesToDelete.length === 0) {
                    throw new custom_error_1.CustomError(http_response_1.HttpRes.status.NOT_FOUND, http_response_1.HttpRes.message.NOT_FOUND, 'No images found for the specified temp_group_id');
                }
            }
            // Process each image for deletion
            for (const image of imagesToDelete) {
                // Extract public_id from URL
                let publicId;
                try {
                    publicId = extractPublicIdFromUrl(image.url);
                }
                catch (error) {
                    throw new custom_error_1.CustomError(http_response_1.HttpRes.status.INTERNAL_SERVER_ERROR, http_response_1.HttpRes.message.INTERNAL_SERVER_ERROR, 'Invalid image URL format');
                }
                // Delete from database
                yield tx.propertyImage.delete({
                    where: { id: image.id },
                });
                // Delete from Cloudinary
                try {
                    yield (0, cloudinary_1.cloudinaryDeleteTempPropertyImage)(publicId);
                }
                catch (cloudinaryError) {
                    // Log the error but don't throw since DB transaction is committed
                    console.error('Failed to delete image from Cloudinary:', cloudinaryError);
                }
                deletedImages.push({
                    id: image.id,
                    publicId,
                    tempGroupId: image.temp_group_id,
                });
            }
            // Handle main image reassignment for single deletion
            if (id && imagesToDelete.length === 1) {
                const image = imagesToDelete[0];
                if (image.is_main && image.property_id) {
                    const nextMainImage = yield tx.propertyImage.findFirst({
                        where: {
                            property_id: image.property_id,
                            status: { not: 'deleted' },
                            id: { not: image.id }, // Exclude the deleted one
                        },
                        orderBy: { order_index: 'asc' },
                    });
                    if (nextMainImage) {
                        yield tx.propertyImage.update({
                            where: { id: nextMainImage.id },
                            data: { is_main: true },
                        });
                    }
                }
            }
            return {
                message: id
                    ? 'Image deleted successfully'
                    : 'Images deleted successfully',
                deletedImages,
                totalDeleted: deletedImages.length,
            };
        }));
        res
            .status(http_response_1.HttpRes.status.OK)
            .json(response_handler_1.ResponseHandler.success(http_response_1.HttpRes.message.OK, result));
    }
    catch (error) {
        next(error);
    }
});
exports.propertyImageDeleteController = propertyImageDeleteController;
