import database from '../../../../lib/config/prisma.client.js';
import { cloudinaryMoveImage } from '../../../../lib/config/cloudinary.js';
import { CustomError } from '../../../../lib/utils/custom.error.js';
import { HttpRes } from '../../../../lib/constant/http.response.js';

export const movePropertyImagesService = async (propertyId: number) => {
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

        const result = await cloudinaryMoveImage(img.public_id, newPublicId);

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

      // Get all rooms for this property
      const rooms = await tx.room.findMany({
        where: { property_id: propertyId },
        select: { id: true },
      });

      // Move room images for each room
      for (const room of rooms) {
        const roomImages = await tx.roomImage.findMany({
          where: {
            room_id: room.id,
            status: 'active',
            public_id: {
              startsWith: 'staysia_property_renting_app/temp',
            },
          },
        });

        const roomImagePromises = roomImages.map(async (img) => {
          if (!img.public_id) {
            throw new CustomError(
              HttpRes.status.INTERNAL_SERVER_ERROR,
              HttpRes.message.INTERNAL_SERVER_ERROR,
              'Room image public_id is null',
            );
          }
          const newPublicId = `staysia_property_renting_app/properties/${propertyId}/rooms/${room.id}/${img.public_id.split('/').pop()}`;

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
      }

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
