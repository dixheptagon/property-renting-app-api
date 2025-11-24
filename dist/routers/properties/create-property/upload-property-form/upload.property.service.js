import { PropertyStatus, ImageStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import database from '../../../../lib/config/prisma.client.js';
import { cloudinaryMoveImage } from '../../../../lib/config/cloudinary.js';
import { CustomError } from '../../../../lib/utils/custom.error.js';
import { HttpRes } from '../../../../lib/constant/http.response.js';
import { normalizeDateRange } from '../../../../lib/utils/normalized.date.js';
export const uploadPropertyService = async (payload, userId) => {
    return await database.$transaction(async (tx) => {
        try {
            // 1. Create Property
            // Get the minimum base price from the property base price
            let propertyRegularPrice = 0;
            if (payload.rooms && payload.rooms.length > 0) {
                const minBasePrice = Math.min(...payload.rooms.map((room) => room.base_price));
                propertyRegularPrice = minBasePrice;
            }
            const property = await tx.property.create({
                data: {
                    uid: uuidv4(),
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
                    status: PropertyStatus.active,
                },
            });
            // 2. Move Property Images
            const propertyImagePromises = payload.propertyImages.map(async (img) => {
                const newPublicId = `staysia_property_renting_app/properties/${property.id}/${img.publicId.split('/').pop()}`;
                await cloudinaryMoveImage(img.publicId, newPublicId);
                return tx.propertyImage.create({
                    data: {
                        property_id: property.id,
                        url: `https://res.cloudinary.com/dzpcr6tzh/image/upload/v${new Date().getTime()}/${newPublicId}.webp`,
                        is_main: img.isMain,
                        order_index: img.orderIndex,
                        public_id: newPublicId,
                        temp_group_id: img.tempGroupId,
                        status: ImageStatus.active,
                    },
                });
            });
            await Promise.all(propertyImagePromises);
            // 3. Process Rooms
            const roomMap = new Map();
            for (const roomData of payload.rooms) {
                const room = await tx.room.create({
                    data: {
                        uid: uuidv4(),
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
                const roomImagePromises = roomData.images.map(async (img) => {
                    const newPublicId = `staysia_property_renting_app/properties/${property.id}/rooms/${room.id}/${img.publicId.split('/').pop()}`;
                    await cloudinaryMoveImage(img.publicId, newPublicId);
                    return tx.roomImage.create({
                        data: {
                            room_id: room.id,
                            url: `https://res.cloudinary.com/dzpcr6tzh/image/upload/v${new Date().getTime()}/${newPublicId}.webp`,
                            is_main: img.isMain,
                            order_index: img.orderIndex,
                            public_id: newPublicId,
                            temp_group_id: img.tempGroupId,
                            status: ImageStatus.active,
                        },
                    });
                });
                await Promise.all(roomImagePromises);
                // Create Peak Season Rates for this room
                const peakRates = payload.peakSeasonRates.filter((rate) => rate.targetTempRoomId === roomData.tempId);
                if (peakRates.length > 0) {
                    await tx.peakSeasonRate.createMany({
                        data: peakRates.map((rate) => {
                            const { start, end } = normalizeDateRange(new Date(rate.start_date), new Date(rate.end_date));
                            return {
                                property_id: property.id,
                                room_id: room.id,
                                start_date: start,
                                end_date: end,
                                adjustment_type: rate.adjustment_type,
                                adjustment_value: rate.adjustment_value,
                            };
                        }),
                    });
                }
                // Create Room Unavailabilities
                const unavailabilities = payload.unavailabilities.filter((unav) => unav.targetTempRoomId === roomData.tempId);
                if (unavailabilities.length > 0) {
                    await tx.roomUnavailability.createMany({
                        data: unavailabilities.map((unav) => {
                            const { start, end } = normalizeDateRange(new Date(unav.start_date), new Date(unav.end_date));
                            return {
                                property_id: property.id,
                                room_id: room.id,
                                start_date: start,
                                end_date: end,
                                reason: unav.reason,
                            };
                        }),
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
            throw new CustomError(HttpRes.status.INTERNAL_SERVER_ERROR, HttpRes.message.INTERNAL_SERVER_ERROR, 'Failed to upload property');
        }
    }, {
        timeout: 60000, // 60 seconds timeout
    });
};
