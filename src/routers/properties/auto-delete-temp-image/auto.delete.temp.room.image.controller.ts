import cron from 'node-cron';
import database from '../../../lib/config/prisma.client.js';
import { cloudinaryDeleteTempPropertyImage } from '../../../lib/config/cloudinary.js';

const extractPublicIdFromUrl = (url: string): string | null => {
  try {
    const urlParts = url.split('/');
    const uploadIndex = urlParts.findIndex((part) => part === 'upload');
    if (uploadIndex === -1) return null;

    let afterUpload = urlParts.slice(uploadIndex + 1);

    if (
      afterUpload[0] &&
      afterUpload[0].startsWith('v') &&
      /^\d+$/.test(afterUpload[0].slice(1))
    ) {
      afterUpload = afterUpload.slice(1);
    }

    const publicIdWithExt = afterUpload.join('/');
    return publicIdWithExt.replace(/\.[^/.]+$/, '');
  } catch (error) {
    console.error('Error extracting public_id from URL:', error);
    return null;
  }
};

// Auto-delete temp room images cron job
export const AutoDeleteTempRoomImage = () => {
  // Run daily at 02:00 server time
  cron.schedule('0 2 * * *', async () => {
    try {
      // Calculate date 7 days ago
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const tempImages = await database.roomImage.findMany({
        where: {
          status: 'temp',
          updated_at: {
            lt: sevenDaysAgo,
          },
        },
      });

      for (const image of tempImages) {
        try {
          let publicId = image.public_id;

          // If public_id is not present, extract from URL
          if (!publicId) {
            publicId = extractPublicIdFromUrl(image.url);
          }

          // Delete from Cloudinary if public_id is available
          if (publicId) {
            await cloudinaryDeleteTempPropertyImage(publicId);
          } else {
            console.warn(
              `Could not extract public_id for image ID ${image.id}, URL: ${image.url}`,
            );
          }

          // Delete from database
          await database.roomImage.delete({
            where: { id: image.id },
          });
        } catch (error) {
          console.error(`Error deleting image ID ${image.id}:`, error);
          // Continue with next image even if one fails
        }
      }
    } catch (error) {
      console.error('Error in auto-delete temp room images cron job:', error);
    }
  });
};
