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
    let { temp_group_id } = req.body;

    console.log('temp_group_id:', temp_group_id);
    console.log('files:', files);

    if (!files || files.length === 0) {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        'No files uploaded',
      );
    }

    // Generate temp_group_id if not provided
    if (!temp_group_id) {
      temp_group_id = crypto.randomUUID();
    } else if (typeof temp_group_id !== 'string') {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        'temp_group_id must be a string',
      );
    }

    const totalImages = await database.propertyImage.count({
      where: { temp_group_id },
    });

    if (totalImages >= 10) {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        `You have already uploaded ${totalImages} images, you can only upload a maximum of 10 images per property`,
      );
    }

    // Use Prisma transaction for atomic operations
    const uploadResults = await database.$transaction(
      async (tx) => {
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

          // Validate file size (3MB max)
          if (file.size > 3 * 1024 * 1024) {
            throw new CustomError(
              HttpRes.status.BAD_REQUEST,
              HttpRes.message.BAD_REQUEST,
              'File size must be less than 3MB',
            );
          }

          // Generate UUID for public_id
          const uuid = crypto.randomUUID();
          const publicId = uuid;

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
              temp_group_id: temp_group_id || null,
            },
          });

          results.push({
            id: propertyImage.id,
            publicId: uploadResult.public_id,
            secureUrl: uploadResult.secure_url,
            isMain: propertyImage.is_main,
            orderIndex: propertyImage.order_index,
            status: propertyImage.status,
            tempGroupId: propertyImage.temp_group_id,
          });
        }

        return results;
      },
      { timeout: 60 * 1000 }, // Set transaction timeout to 60 seconds
    );

    res
      .status(HttpRes.status.CREATED)
      .json(
        ResponseHandler.success('Images uploaded successfully', uploadResults),
      );
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
