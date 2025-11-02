import database from '../../../../lib/config/prisma.client';
import { cloudinaryMoveImage } from '../../../../lib/config/cloudinary';
import { CustomError } from '../../../../lib/utils/custom.error';
import { HttpRes } from '../../../../lib/constant/http.response';

export const movePropertyImagesService = async (propertyId: number) => {
  console.log('Starting to move property images for property:', propertyId);

  return await database.$transaction(async (tx) => {
    try {
      // Get all property images that need to be moved (status = active, public_id starts with temp)
      const propertyImages = await tx.propertyImage.findMany({
        where: {
          property_id: propertyId,
          status: 'active',
          public_id: {
            startsWith: 'staysia_property_renting_app/temp',
          },
        },
      });

      console.log(`Found ${propertyImages.length} property images to move`);

      // Move property images
      const propertyImagePromises = propertyImages.map(async (img) => {
        if (!img.public_id) {
          throw new CustomError(
            HttpRes.status.INTERNAL_SERVER_ERROR,
            HttpRes.message.INTERNAL_SERVER_ERROR,
            'Property image public_id is null',
          );
        }

        const newPublicId = `staysia_property_renting_app/properties/${propertyId}/${img.public_id.split('/').pop()}`;
        console.log(
          `Moving property image from ${img.public_id} to ${newPublicId}`,
        );

        const result = await cloudinaryMoveImage(img.public_id, newPublicId);
        console.log(result);

        // Update database with new public_id and URL
        return tx.propertyImage.update({
          where: { id: img.id },
          data: {
            public_id: newPublicId,
            url: `https://res.cloudinary.com/dzpcr6tzh/image/upload/v${new Date().getTime()}/${newPublicId}.webp`,
          },
        });
      });

      await Promise.all(propertyImagePromises);
      console.log('Property images moved successfully');

      // Get all rooms for this property
      const rooms = await tx.room.findMany({
        where: { property_id: propertyId },
        select: { id: true },
      });

      // Move room images for each room
      for (const room of rooms) {
        console.log('Processing room images for room:', room.id);

        const roomImages = await tx.roomImage.findMany({
          where: {
            room_id: room.id,
            status: 'active',
            public_id: {
              startsWith: 'staysia_property_renting_app/temp',
            },
          },
        });

        console.log(
          `Found ${roomImages.length} room images to move for room ${room.id}`,
        );

        const roomImagePromises = roomImages.map(async (img) => {
          if (!img.public_id) {
            throw new CustomError(
              HttpRes.status.INTERNAL_SERVER_ERROR,
              HttpRes.message.INTERNAL_SERVER_ERROR,
              'Room image public_id is null',
            );
          }
          const newPublicId = `staysia_property_renting_app/properties/${propertyId}/rooms/${room.id}/${img.public_id.split('/').pop()}`;
          console.log(
            `Moving room image from ${img.public_id} to ${newPublicId}`,
          );

          await cloudinaryMoveImage(img.public_id, newPublicId);

          // Update database with new public_id and URL
          return tx.roomImage.update({
            where: { id: img.id },
            data: {
              public_id: newPublicId,
              url: `https://res.cloudinary.com/dzpcr6tzh/image/upload/v${new Date().getTime()}/${newPublicId}.webp`,
            },
          });
        });

        await Promise.all(roomImagePromises);
        console.log(`Room images moved successfully for room ${room.id}`);
      }

      console.log('All images moved successfully');
      return {
        message: 'Property images moved successfully',
        propertyId,
      };
    } catch (error) {
      console.error('Failed to move property images:', error);
      throw new CustomError(
        HttpRes.status.INTERNAL_SERVER_ERROR,
        HttpRes.message.INTERNAL_SERVER_ERROR,
        'Failed to move property images',
      );
    }
  });
};
