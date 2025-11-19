import { NextFunction, Request, Response } from 'express';
import { ResponseHandler } from '../../../../lib/utils/response.handler';
import { HttpRes } from '../../../../lib/constant/http.response';
import { CustomError } from '../../../../lib/utils/custom.error';
import database from '../../../../lib/config/prisma.client';
import { cloudinaryDeleteTempPropertyImage } from '../../../../lib/config/cloudinary';

// Helper function to extract public_id from Cloudinary URL
const extractPublicIdFromUrl = (url: string): string => {
  const parsed = new URL(url);

  const pathParts = parsed.pathname.split('/');
  const uploadIndex = pathParts.findIndex((p) => p === 'upload');
  if (uploadIndex === -1) throw new Error('Invalid Cloudinary URL');

  // Get everything after 'upload/' until the extension
  const pathAfterUpload = pathParts.slice(uploadIndex + 2).join('/');

  const publicIdWithExt = pathAfterUpload.split('.')[0]; // Remove extension

  return publicIdWithExt;
};

export const propertyImageDeleteController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { imageId, temp_group_id } = req.params;

  try {
    // Validate that either imageId or temp_group_id is provided
    if (!imageId && !temp_group_id) {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        'Either imageId or temp_group_id must be provided',
      );
    }

    // Validate imageId if provided
    let id: number | null = null;
    if (imageId) {
      id = parseInt(imageId, 10);
      if (isNaN(id)) {
        throw new CustomError(
          HttpRes.status.BAD_REQUEST,
          HttpRes.message.BAD_REQUEST,
          'Invalid image ID',
        );
      }
    }

    // Validate temp_group_id if provided
    if (temp_group_id && typeof temp_group_id !== 'string') {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        'temp_group_id must be a string',
      );
    }

    // Use Prisma transaction for atomic operations
    const result = await database.$transaction(async (tx) => {
      let imagesToDelete: any[] = [];
      let deletedImages: any[] = [];

      if (id) {
        // Single image deletion
        const image = await tx.propertyImage.findUnique({
          where: { id },
        });

        if (!image) {
          throw new CustomError(
            HttpRes.status.NOT_FOUND,
            HttpRes.message.NOT_FOUND,
            'Image not found',
          );
        }

        imagesToDelete = [image];
      } else if (temp_group_id) {
        // Group deletion by temp_group_id
        imagesToDelete = await tx.propertyImage.findMany({
          where: { temp_group_id },
        });

        if (imagesToDelete.length === 0) {
          throw new CustomError(
            HttpRes.status.NOT_FOUND,
            HttpRes.message.NOT_FOUND,
            'No images found for the specified temp_group_id',
          );
        }
      }

      // Process each image for deletion
      for (const image of imagesToDelete) {
        // Extract public_id from URL
        let publicId: string;
        try {
          publicId = extractPublicIdFromUrl(image.url);
        } catch (error) {
          throw new CustomError(
            HttpRes.status.INTERNAL_SERVER_ERROR,
            HttpRes.message.INTERNAL_SERVER_ERROR,
            'Invalid image URL format',
          );
        }

        // Delete from database
        await tx.propertyImage.delete({
          where: { id: image.id },
        });

        // Delete from Cloudinary
        try {
          await cloudinaryDeleteTempPropertyImage(publicId);
        } catch (cloudinaryError) {
          // Log the error but don't throw since DB transaction is committed
          console.error(
            'Failed to delete image from Cloudinary:',
            cloudinaryError,
          );
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
          const nextMainImage = await tx.propertyImage.findFirst({
            where: {
              property_id: image.property_id,
              status: { not: 'deleted' },
              id: { not: image.id }, // Exclude the deleted one
            },
            orderBy: { order_index: 'asc' },
          });

          if (nextMainImage) {
            await tx.propertyImage.update({
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
    });

    res
      .status(HttpRes.status.OK)
      .json(ResponseHandler.success(HttpRes.message.OK, result));
  } catch (error) {
    next(error);
  }
};
