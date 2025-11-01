import { PropertyStatus, ImageStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import database from '../../../../lib/config/prisma.client';
import { cloudinaryMoveImage } from '../../../../lib/config/cloudinary';
import { CustomError } from '../../../../lib/utils/custom.error';
import { HttpRes } from '../../../../lib/constant/http.response';
import { UploadPropertyPayload } from './upload.property.types';

export const uploadPropertyService = async (
  payload: UploadPropertyPayload,
  tenantId: number,
) => {
  return await database.$transaction(async (tx) => {
    try {
      // 1. Create Property
      const property = await tx.property.create({
        data: {
          uid: uuidv4(),
          user_id: tenantId,
          category: payload.state.property.category as any,
          title: payload.state.property.title,
          description: payload.state.property.description,
          base_price: payload.state.property.base_price,
          address: payload.state.property.address,
          city: payload.state.property.city,
          country: payload.state.property.country,
          postal_code: payload.state.property.postal_code,
          latitude: payload.state.property.latitude,
          longitude: payload.state.property.longitude,
          place_id: payload.state.property.place_id,
          map_url: payload.state.property.map_url,
          amenities: payload.state.property.amenities || undefined,
          custom_amenities:
            payload.state.property.custom_amenities || undefined,
          rules: payload.state.property.rules || undefined,
          custom_rules: payload.state.property.custom_rules || undefined,
          status: PropertyStatus.active,
        },
      });

      // 2. Move Property Images
      const propertyImagePromises = payload.state.propertyImages.map(
        async (img) => {
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
        },
      );

      await Promise.all(propertyImagePromises);

      // 3. Process Rooms
      const roomMap = new Map<string, number>();

      for (const roomData of payload.state.rooms) {
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
        const peakRates = payload.state.peakSeasonRates.filter(
          (rate) => rate.targetTempRoomId === roomData.tempId,
        );

        if (peakRates.length > 0) {
          await tx.peakSeasonRate.createMany({
            data: peakRates.map((rate) => ({
              property_id: property.id,
              room_id: room.id,
              start_date: new Date(rate.start_date),
              end_date: new Date(rate.end_date),
              adjustment_type: rate.adjustment_type as any,
              adjustment_value: rate.adjustment_value,
            })),
          });
        }

        // Create Room Unavailabilities
        const unavailabilities = payload.state.unavailabilities.filter(
          (unav) => unav.targetTempRoomId === roomData.tempId,
        );

        if (unavailabilities.length > 0) {
          await tx.roomUnavailability.createMany({
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
    } catch (error) {
      console.error('Transaction failed:', error);
      throw new CustomError(
        HttpRes.status.INTERNAL_SERVER_ERROR,
        HttpRes.message.INTERNAL_SERVER_ERROR,
        'Failed to upload property',
      );
    }
  });
};
