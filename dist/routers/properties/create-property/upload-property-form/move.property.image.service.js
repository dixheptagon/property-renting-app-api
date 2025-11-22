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
exports.movePropertyImagesService = void 0;
const prisma_client_1 = __importDefault(require("../../../../lib/config/prisma.client"));
const cloudinary_1 = require("../../../../lib/config/cloudinary");
const custom_error_1 = require("../../../../lib/utils/custom.error");
const http_response_1 = require("../../../../lib/constant/http.response");
const movePropertyImagesService = (propertyId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_client_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Get all property images that need to be moved (status = active, public_id starts with temp)
            const propertyImages = yield tx.propertyImage.findMany({
                where: {
                    property_id: propertyId,
                    status: 'active',
                    public_id: {
                        startsWith: 'staysia_property_renting_app/temp',
                    },
                },
            });
            // Move property images
            const propertyImagePromises = propertyImages.map((img) => __awaiter(void 0, void 0, void 0, function* () {
                if (!img.public_id) {
                    throw new custom_error_1.CustomError(http_response_1.HttpRes.status.INTERNAL_SERVER_ERROR, http_response_1.HttpRes.message.INTERNAL_SERVER_ERROR, 'Property image public_id is null');
                }
                const newPublicId = `staysia_property_renting_app/properties/${propertyId}/${img.public_id.split('/').pop()}`;
                const result = yield (0, cloudinary_1.cloudinaryMoveImage)(img.public_id, newPublicId);
                // Update database with new public_id and URL
                return tx.propertyImage.update({
                    where: { id: img.id },
                    data: {
                        public_id: newPublicId,
                        url: `https://res.cloudinary.com/dzpcr6tzh/image/upload/v${new Date().getTime()}/${newPublicId}.webp`,
                    },
                });
            }));
            yield Promise.all(propertyImagePromises);
            // Get all rooms for this property
            const rooms = yield tx.room.findMany({
                where: { property_id: propertyId },
                select: { id: true },
            });
            // Move room images for each room
            for (const room of rooms) {
                const roomImages = yield tx.roomImage.findMany({
                    where: {
                        room_id: room.id,
                        status: 'active',
                        public_id: {
                            startsWith: 'staysia_property_renting_app/temp',
                        },
                    },
                });
                const roomImagePromises = roomImages.map((img) => __awaiter(void 0, void 0, void 0, function* () {
                    if (!img.public_id) {
                        throw new custom_error_1.CustomError(http_response_1.HttpRes.status.INTERNAL_SERVER_ERROR, http_response_1.HttpRes.message.INTERNAL_SERVER_ERROR, 'Room image public_id is null');
                    }
                    const newPublicId = `staysia_property_renting_app/properties/${propertyId}/rooms/${room.id}/${img.public_id.split('/').pop()}`;
                    yield (0, cloudinary_1.cloudinaryMoveImage)(img.public_id, newPublicId);
                    // Update database with new public_id and URL
                    return tx.roomImage.update({
                        where: { id: img.id },
                        data: {
                            public_id: newPublicId,
                            url: `https://res.cloudinary.com/dzpcr6tzh/image/upload/v${new Date().getTime()}/${newPublicId}.webp`,
                        },
                    });
                }));
                yield Promise.all(roomImagePromises);
            }
            return {
                message: 'Property images moved successfully',
                propertyId,
            };
        }
        catch (error) {
            console.error('Failed to move property images:', error);
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.INTERNAL_SERVER_ERROR, http_response_1.HttpRes.message.INTERNAL_SERVER_ERROR, 'Failed to move property images');
        }
    }));
});
exports.movePropertyImagesService = movePropertyImagesService;
