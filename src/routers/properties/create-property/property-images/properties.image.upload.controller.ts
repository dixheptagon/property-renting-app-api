import { NextFunction, Request, Response } from 'express';
import {
  cloudinaryUploadTempPropertyImage,
  cloudinaryDeleteTempPropertyImage,
} from '../../../../lib/config/cloudinary';
import { ResponseHandler } from '../../../../lib/utils/response.handler';
import { HttpRes } from '../../../../lib/constant/http.response';
import { CustomError } from '../../../../lib/utils/custom.error';
import { UploadApiResponse } from 'cloudinary';
import database from '../../../../lib/config/prisma.client';

export const propertyImageUploadController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const uploadedPublicIds: string[] = [];

  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        'No files uploaded',
      );
    }

    // Use Prisma transaction for atomic operations
    const uploadResults = await database.$transaction(async (tx) => {
      const results = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate MIME type
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/jpg',
          'image/webp',
        ];
        if (!allowedMimes.includes(file.mimetype)) {
          throw new CustomError(
            HttpRes.status.BAD_REQUEST,
            HttpRes.message.BAD_REQUEST,
            `Invalid file type: ${file.mimetype}. Only JPEG, PNG, JPG, and WebP are allowed.`,
          );
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          throw new CustomError(
            HttpRes.status.BAD_REQUEST,
            HttpRes.message.BAD_REQUEST,
            'File size must be less than 5MB',
          );
        }

        // Generate UUID for public_id
        const uuid = crypto.randomUUID();
        const publicId = `temp/${uuid}`;

        // Upload to Cloudinary with custom public_id
        const uploadResult = (await cloudinaryUploadTempPropertyImage(
          file.buffer,
          { public_id: publicId },
        )) as UploadApiResponse;

        // Track uploaded public IDs for cleanup on failure
        uploadedPublicIds.push(uploadResult.public_id);

        // Save to database with status 'temp' and set first image as main
        const propertyImage = await tx.propertyImage.create({
          data: {
            url: uploadResult.secure_url,
            is_main: i === 0, // First image is main
            order_index: i,
            status: 'temp',
          },
        });

        results.push({
          id: propertyImage.id,
          publicId: uploadResult.public_id,
          secureUrl: uploadResult.secure_url,
          isMain: propertyImage.is_main,
          orderIndex: propertyImage.order_index,
          status: propertyImage.status,
        });
      }

      return results;
    });

    res
      .status(HttpRes.status.CREATED)
      .json(ResponseHandler.success(HttpRes.message.CREATED, uploadResults));
  } catch (error) {
    // Cleanup uploaded Cloudinary images on failure
    if (uploadedPublicIds.length > 0) {
      try {
        await Promise.allSettled(
          uploadedPublicIds.map((publicId) =>
            cloudinaryDeleteTempPropertyImage(publicId),
          ),
        );
      } catch (cleanupError) {
        // Log cleanup error but don't override original error
        console.error('Failed to cleanup Cloudinary images:', cleanupError);
      }
    }

    next(error);
  }
};
