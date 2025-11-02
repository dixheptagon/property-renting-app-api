import { PropertyStatus, ImageStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import database from '../../../../lib/config/prisma.client';
import { cloudinaryMoveImage } from '../../../../lib/config/cloudinary';
import { CustomError } from '../../../../lib/utils/custom.error';
import { HttpRes } from '../../../../lib/constant/http.response';
import { UploadPropertyPayload } from './upload.property.types';

export const uploadPropertyService = async (
  payload: UploadPropertyPayload,
  userId: number,
) => {
  return await database.$transaction(
    async (tx) => {
      try {
        console.log('Starting property upload transaction');
        // 1. Create Property
        console.log('Creating property');

        // Get the minimum base price from the property base price
        let propertyRegularPrice = 0;
        if (payload.rooms && payload.rooms.length > 0) {
          const minBasePrice = Math.min(
            ...payload.rooms.map((room) => room.base_price),
          );
          propertyRegularPrice = minBasePrice;
        }

        const property = await tx.property.create({
          data: {
            uid: uuidv4(),
            user_id: userId,
            category: payload.property.category as any,
            title: payload.property.title,
            description: payload.property.description,
            base_price:
              propertyRegularPrice || payload.rooms[0].base_price || 0,
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
        console.log('Property created with id:', property.id);

        // 2. Move Property Images
        console.log('Starting to move property images');
        const propertyImagePromises = payload.propertyImages.map(
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
        console.log('Property images moved successfully');

        // 3. Process Rooms
        console.log('Starting to process rooms');
        const roomMap = new Map<string, number>();

        for (const roomData of payload.rooms) {
          console.log('Creating room:', roomData.name);
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
          console.log('Room created with id:', room.id);

          roomMap.set(roomData.tempId, room.id);

          // Move Room Images
          console.log('Moving images for room:', room.id);
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
          console.log('Room images moved for room:', room.id);

          // Create Peak Season Rates for this room
          console.log('Creating peak season rates for room:', room.id);
          const peakRates = payload.peakSeasonRates.filter(
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
          console.log('Peak season rates created for room:', room.id);

          // Create Room Unavailabilities
          console.log('Creating unavailabilities for room:', room.id);
          const unavailabilities = payload.unavailabilities.filter(
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
          console.log('Unavailabilities created for room:', room.id);
        }
        console.log('All rooms processed successfully');

        console.log('Transaction completed successfully');
        return {
          propertyId: property.id,
          message: 'Property uploaded successfully',
        };
      } catch (error) {
        console.error('Transaction failed:', error);
        console.log('Transaction rollback initiated');
        throw new CustomError(
          HttpRes.status.INTERNAL_SERVER_ERROR,
          HttpRes.message.INTERNAL_SERVER_ERROR,
          'Failed to upload property',
        );
      }
    },
    {
      timeout: 60000, // 60 seconds timeout
    },
  );
};
