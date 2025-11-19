import { NextFunction, Request, Response } from 'express';
import { ResponseHandler } from '../../../../lib/utils/response.handler';
import { HttpRes } from '../../../../lib/constant/http.response';
import { CustomError } from '../../../../lib/utils/custom.error';
import database from '../../../../lib/config/prisma.client';

export const setPropertiesMainImageController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { imageId } = req.params;
    const { property_id, temp_group_id } = req.body;

    // Validate imageId
    const id = parseInt(imageId, 10);
    if (isNaN(id)) {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        'Invalid image ID',
      );
    }

    // Validate that either property_id or temp_group_id is provided
    if (!property_id && !temp_group_id) {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        'Either property_id or temp_group_id must be provided',
      );
    }

    if (property_id && temp_group_id) {
      throw new CustomError(
        HttpRes.status.BAD_REQUEST,
        HttpRes.message.BAD_REQUEST,
        'Cannot provide both property_id and temp_group_id',
      );
    }

    // Validate property_id if provided
    if (property_id) {
      const propertyIdNum = parseInt(property_id, 10);
      if (isNaN(propertyIdNum)) {
        throw new CustomError(
          HttpRes.status.BAD_REQUEST,
          HttpRes.message.BAD_REQUEST,
          'Invalid property_id',
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
      // Find the image to set as main
      const targetImage = await tx.propertyImage.findUnique({
        where: { id },
      });

      if (!targetImage) {
        throw new CustomError(
          HttpRes.status.NOT_FOUND,
          HttpRes.message.NOT_FOUND,
          'Image not found',
        );
      }

      // Verify the image belongs to the specified property or temp group
      if (property_id) {
        const propertyIdNum = parseInt(property_id, 10);
        if (targetImage.property_id !== propertyIdNum) {
          throw new CustomError(
            HttpRes.status.BAD_REQUEST,
            HttpRes.message.BAD_REQUEST,
            'Image does not belong to the specified property',
          );
        }
      } else if (temp_group_id) {
        if (targetImage.temp_group_id !== temp_group_id) {
          throw new CustomError(
            HttpRes.status.BAD_REQUEST,
            HttpRes.message.BAD_REQUEST,
            'Image does not belong to the specified temp group',
          );
        }
      }

      // Set all other images in the same property/temp group to not main
      const updateCondition = property_id
        ? { property_id: parseInt(property_id, 10) }
        : { temp_group_id };

      await tx.propertyImage.updateMany({
        where: {
          ...updateCondition,
          id: { not: id }, // Exclude the target image
        },
        data: { is_main: false },
      });

      // Set the target image as main
      const updatedImage = await tx.propertyImage.update({
        where: { id },
        data: { is_main: true },
      });

      return {
        message: 'Main image updated successfully',
        imageId: updatedImage.id,
        isMain: updatedImage.is_main,
        propertyId: updatedImage.property_id,
        tempGroupId: updatedImage.temp_group_id,
      };
    });

    res
      .status(HttpRes.status.OK)
      .json(ResponseHandler.success(HttpRes.message.OK, result));
  } catch (error) {
    next(error);
  }
};
