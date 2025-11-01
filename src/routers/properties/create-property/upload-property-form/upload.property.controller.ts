import { Request, Response, NextFunction } from 'express';
import { UploadPropertySchema } from './upload.property.validation';
import { uploadPropertyService } from './upload.property.service';
import { ResponseHandler } from '../../../../lib/utils/response.handler';
import { CustomError } from '../../../../lib/utils/custom.error';
import { HttpRes } from '../../../../lib/constant/http.response';

export const uploadPropertyController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Validate request body
    const validatedData = await UploadPropertySchema.validate(req.body, {
      abortEarly: false,
    });

    // Get tenant ID from middleware
    const tenantId = (req as any).user?.id;
    if (!tenantId) {
      throw new CustomError(
        HttpRes.status.UNAUTHORIZED,
        HttpRes.message.UNAUTHORIZED,
        'Tenant not authenticated',
      );
    }

    // Call service
    const result = await uploadPropertyService(validatedData as any, tenantId);

    // Send success response
    res
      .status(HttpRes.status.CREATED)
      .json(ResponseHandler.success(HttpRes.message.CREATED, result));
  } catch (error) {
    next(error);
  }
};
