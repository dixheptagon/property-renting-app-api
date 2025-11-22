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
exports.setPropertiesMainImageController = void 0;
const response_handler_1 = require("../../../../lib/utils/response.handler");
const http_response_1 = require("../../../../lib/constant/http.response");
const custom_error_1 = require("../../../../lib/utils/custom.error");
const prisma_client_1 = __importDefault(require("../../../../lib/config/prisma.client"));
const setPropertiesMainImageController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { imageId } = req.params;
        const { property_id, temp_group_id } = req.body;
        // Validate imageId
        const id = parseInt(imageId, 10);
        if (isNaN(id)) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Invalid image ID');
        }
        // Validate that either property_id or temp_group_id is provided
        if (!property_id && !temp_group_id) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Either property_id or temp_group_id must be provided');
        }
        if (property_id && temp_group_id) {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Cannot provide both property_id and temp_group_id');
        }
        // Validate property_id if provided
        if (property_id) {
            const propertyIdNum = parseInt(property_id, 10);
            if (isNaN(propertyIdNum)) {
                throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Invalid property_id');
            }
        }
        // Validate temp_group_id if provided
        if (temp_group_id && typeof temp_group_id !== 'string') {
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'temp_group_id must be a string');
        }
        // Use Prisma transaction for atomic operations
        const result = yield prisma_client_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Find the image to set as main
            const targetImage = yield tx.propertyImage.findUnique({
                where: { id },
            });
            if (!targetImage) {
                throw new custom_error_1.CustomError(http_response_1.HttpRes.status.NOT_FOUND, http_response_1.HttpRes.message.NOT_FOUND, 'Image not found');
            }
            // Verify the image belongs to the specified property or temp group
            if (property_id) {
                const propertyIdNum = parseInt(property_id, 10);
                if (targetImage.property_id !== propertyIdNum) {
                    throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Image does not belong to the specified property');
                }
            }
            else if (temp_group_id) {
                if (targetImage.temp_group_id !== temp_group_id) {
                    throw new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Image does not belong to the specified temp group');
                }
            }
            // Set all other images in the same property/temp group to not main
            const updateCondition = property_id
                ? { property_id: parseInt(property_id, 10) }
                : { temp_group_id };
            yield tx.propertyImage.updateMany({
                where: Object.assign(Object.assign({}, updateCondition), { id: { not: id } }),
                data: { is_main: false },
            });
            // Set the target image as main
            const updatedImage = yield tx.propertyImage.update({
                where: { id },
                data: { is_main: true },
            });
            return {
                message: 'Main image updated successfully',
                imageId: updatedImage.id,
                isMain: updatedImage.is_main,
                propertyId: updatedImage.property_id,
                tempGroupId: updatedImage.temp_group_id,
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
exports.setPropertiesMainImageController = setPropertiesMainImageController;
