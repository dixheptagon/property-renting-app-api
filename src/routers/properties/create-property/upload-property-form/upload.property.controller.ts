import { Request, Response, NextFunction } from 'express';
import { UploadPropertySchema } from './upload.property.validation';
import { uploadPropertyService } from './upload.property.service';
import { sendPropertyUploadSuccessEmail } from './send.email.upload.successfull';
import { sendPropertyUploadFailedEmail } from './send.email.upload.failed';
import { ResponseHandler } from '../../../../lib/utils/response.handler';
import { CustomError } from '../../../../lib/utils/custom.error';
import { HttpRes } from '../../../../lib/constant/http.response';
import database from '../../../../lib/config/prisma.client';
import { InferType } from 'yup';

export const uploadPropertyController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let propertyId: number | null = null;
  let tenantEmail: string | null = null;

  try {
    // Validate request body
    const validatedData = await UploadPropertySchema.validate(req.body, {
      abortEarly: false,
    });

    // Get tenant ID from middleware
    const tenantId = (req as any).user?.uid;

    if (!tenantId) {
      throw new CustomError(
        HttpRes.status.UNAUTHORIZED,
        HttpRes.message.UNAUTHORIZED,
        'Tenant not authenticated',
      );
    }

    // Get tenant email for notifications
    const tenant = await database.user.findUnique({
      where: { uid: tenantId },
      select: { email: true, id: true },
    });

    if (!tenant) {
      throw new CustomError(
        HttpRes.status.UNAUTHORIZED,
        HttpRes.message.UNAUTHORIZED,
        'Tenant not found',
      );
    }

    tenantEmail = tenant.email;

    // Call service
    const result = await uploadPropertyService(validatedData as any, tenant.id);
    propertyId = result.propertyId;

    // Send success email
    await sendPropertyUploadSuccessEmail({
      email: tenantEmail,
      propertyId: propertyId,
      payload: validatedData as any,
    });

    // Send success response
    res
      .status(HttpRes.status.CREATED)
      .json(ResponseHandler.success(HttpRes.message.CREATED, result));
  } catch (error) {
    // Send failure email if we have tenant email
    if (tenantEmail) {
      const errorMessage =
        error instanceof CustomError
          ? error.details || error.message
          : 'An unexpected error occurred during property upload';

      await sendPropertyUploadFailedEmail({
        email: tenantEmail,
        errorMessage: errorMessage,
      });
    }

    next(error);
  }
};
