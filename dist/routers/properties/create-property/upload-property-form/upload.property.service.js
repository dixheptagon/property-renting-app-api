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
exports.uploadPropertyService = void 0;
const client_1 = require("@prisma/client");
const uuid_1 = require("uuid");
const prisma_client_1 = __importDefault(require("../../../../lib/config/prisma.client"));
const cloudinary_1 = require("../../../../lib/config/cloudinary");
const custom_error_1 = require("../../../../lib/utils/custom.error");
const http_response_1 = require("../../../../lib/constant/http.response");
const uploadPropertyService = (payload, userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_client_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // 1. Create Property
            // Get the minimum base price from the property base price
            let propertyRegularPrice = 0;
            if (payload.rooms && payload.rooms.length > 0) {
                const minBasePrice = Math.min(...payload.rooms.map((room) => room.base_price));
                propertyRegularPrice = minBasePrice;
            }
            const property = yield tx.property.create({
                data: {
                    uid: (0, uuid_1.v4)(),
                    user_id: userId,
                    category: payload.property.category,
                    title: payload.property.title,
                    description: payload.property.description,
                    base_price: propertyRegularPrice || payload.rooms[0].base_price || 0,
                    address: payload.property.address,
                    city: payload.property.city,
                    country: payload.property.country,
                    postal_code: payload.property.postal_code,
                    latitude: payload.property.latitude,
                    longitude: payload.property.longitude,
                    place_id: payload.property.place_id,
                    map_url: payload.property.map_url,
                    amenities: payload.property.amenities || undefined,
                    custom_amenities: payload.property.custom_amenities || undefined,
                    rules: payload.property.rules || undefined,
                    custom_rules: payload.property.custom_rules || undefined,
                    status: client_1.PropertyStatus.active,
                },
            });
            // 2. Move Property Images
            const propertyImagePromises = payload.propertyImages.map((img) => __awaiter(void 0, void 0, void 0, function* () {
                const newPublicId = `staysia_property_renting_app/properties/${property.id}/${img.publicId.split('/').pop()}`;
                yield (0, cloudinary_1.cloudinaryMoveImage)(img.publicId, newPublicId);
                return tx.propertyImage.create({
                    data: {
                        property_id: property.id,
                        url: `https://res.cloudinary.com/dzpcr6tzh/image/upload/v${new Date().getTime()}/${newPublicId}.webp`,
                        is_main: img.isMain,
                        order_index: img.orderIndex,
                        public_id: newPublicId,
                        temp_group_id: img.tempGroupId,
                        status: client_1.ImageStatus.active,
                    },
                });
            }));
            yield Promise.all(propertyImagePromises);
            // 3. Process Rooms
            const roomMap = new Map();
            for (const roomData of payload.rooms) {
                const room = yield tx.room.create({
                    data: {
                        uid: (0, uuid_1.v4)(),
                        property_id: property.id,
                        name: roomData.name,
                        description: roomData.description,
                        base_price: roomData.base_price,
                        max_guest: roomData.max_guest,
                        bedrooms: roomData.bedrooms,
                        bathrooms: roomData.bathrooms,
                        beds: roomData.beds,
                        highlight: roomData.highlight || undefined,
                        custom_highlight: roomData.custom_highlight || undefined,
                        total_units: roomData.total_units,
                    },
                });
                roomMap.set(roomData.tempId, room.id);
                // Move Room Images
                const roomImagePromises = roomData.images.map((img) => __awaiter(void 0, void 0, void 0, function* () {
                    const newPublicId = `staysia_property_renting_app/properties/${property.id}/rooms/${room.id}/${img.publicId.split('/').pop()}`;
                    yield (0, cloudinary_1.cloudinaryMoveImage)(img.publicId, newPublicId);
                    return tx.roomImage.create({
                        data: {
                            room_id: room.id,
                            url: `https://res.cloudinary.com/dzpcr6tzh/image/upload/v${new Date().getTime()}/${newPublicId}.webp`,
                            is_main: img.isMain,
                            order_index: img.orderIndex,
                            public_id: newPublicId,
                            temp_group_id: img.tempGroupId,
                            status: client_1.ImageStatus.active,
                        },
                    });
                }));
                yield Promise.all(roomImagePromises);
                // Create Peak Season Rates for this room
                const peakRates = payload.peakSeasonRates.filter((rate) => rate.targetTempRoomId === roomData.tempId);
                if (peakRates.length > 0) {
                    yield tx.peakSeasonRate.createMany({
                        data: peakRates.map((rate) => ({
                            property_id: property.id,
                            room_id: room.id,
                            start_date: new Date(rate.start_date),
                            end_date: new Date(rate.end_date),
                            adjustment_type: rate.adjustment_type,
                            adjustment_value: rate.adjustment_value,
                        })),
                    });
                }
                // Create Room Unavailabilities
                const unavailabilities = payload.unavailabilities.filter((unav) => unav.targetTempRoomId === roomData.tempId);
                if (unavailabilities.length > 0) {
                    yield tx.roomUnavailability.createMany({
                        data: unavailabilities.map((unav) => ({
                            property_id: property.id,
                            room_id: room.id,
                            start_date: new Date(unav.start_date),
                            end_date: new Date(unav.end_date),
                            reason: unav.reason,
                        })),
                    });
                }
            }
            return {
                propertyId: property.id,
                message: 'Property uploaded successfully',
            };
        }
        catch (error) {
            console.error('Transaction failed:', error);
            throw new custom_error_1.CustomError(http_response_1.HttpRes.status.INTERNAL_SERVER_ERROR, http_response_1.HttpRes.message.INTERNAL_SERVER_ERROR, 'Failed to upload property');
        }
    }), {
        timeout: 60000, // 60 seconds timeout
    });
});
exports.uploadPropertyService = uploadPropertyService;
