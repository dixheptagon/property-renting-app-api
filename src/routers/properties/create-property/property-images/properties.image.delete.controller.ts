import { NextFunction, Request, Response } from 'express';
import { ResponseHandler } from '../../../../lib/utils/response.handler';
import { HttpRes } from '../../../../lib/constant/http.response';
import { CustomError } from '../../../../lib/utils/custom.error';
import database from '../../../../lib/config/prisma.client';
import { cloudinaryDeleteTempPropertyImage } from '../../../../lib/config/cloudinary';
import { v2 as cloudinary } from 'cloudinary';

// Helper function to extract public_id from Cloudinary URL
const extractPublicIdFromUrl = (url: string): string => {
  // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{folder}/{public_id}.{ext}
  const urlParts = url.split('/');
  const uploadIndex = urlParts.findIndex((part) => part === 'upload');
  if (uploadIndex === -1) throw new Error('Invalid Cloudinary URL');

  // Get everything after 'upload/' until the extension
  const pathAfterUpload = urlParts.slice(uploadIndex + 1).join('/');
  const publicIdWithExt = pathAfterUpload.split('.')[0]; // Remove extension
  return publicIdWithExt;
};

const cloudinaryDeletePropertyImage = async (publicId: string) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
    });
    return result;
  } catch (error) {
    throw new CustomError(
      HttpRes.status.INTERNAL_SERVER_ERROR,
      HttpRes.message.INTERNAL_SERVER_ERROR,
      'Failed to delete image from Cloudinary',
    );
  }
};

export const propertyImageDeleteController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { imageId } = req.body;

  try {
    // Validate imageId
    const id = parseInt(imageId, 10);
    if (isNaN(id)) {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        'Invalid image ID',
      );
    }

    // Use Prisma transaction for atomic operations
    const result = await database.$transaction(async (tx) => {
      // Find the image
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
        where: { id },
      });

      // Delete from Cloudinary
      try {
        await cloudinaryDeletePropertyImage(publicId);
      } catch (cloudinaryError) {
        // Log the error but don't throw since DB transaction is committed
        console.error(
          'Failed to delete image from Cloudinary:',
          cloudinaryError,
        );
      }

      // If the deleted image was main, set another image as main
      if (image.is_main && image.property_id) {
        const nextMainImage = await tx.propertyImage.findFirst({
          where: {
            property_id: image.property_id,
            status: { not: 'deleted' },
            id: { not: id }, // Exclude the deleted one
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

      return {
        message: 'Image deleted successfully',
        deletedImageId: id,
        publicId,
      };
    });

    res
      .status(HttpRes.status.OK)
      .json(ResponseHandler.success(HttpRes.message.OK, result));
  } catch (error) {
    next(error);
  }
};
