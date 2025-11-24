import { UploadPropertySchema } from './upload.property.validation.js';
import { uploadPropertyService } from './upload.property.service.js';
import { sendPropertyUploadSuccessEmail } from './send.email.upload.successfull.js';
import { sendPropertyUploadFailedEmail } from './send.email.upload.failed.js';
import { ResponseHandler } from '../../../../lib/utils/response.handler.js';
import { CustomError } from '../../../../lib/utils/custom.error.js';
import { HttpRes } from '../../../../lib/constant/http.response.js';
import database from '../../../../lib/config/prisma.client.js';
export const uploadPropertyController = async (req, res, next) => {
    let propertyId = null;
    let tenantEmail = null;
    try {
        // Validate request body
        const validatedData = await UploadPropertySchema.validate(req.body, {
            abortEarly: false,
        });
        // Get tenant ID from middleware
        const tenantId = req.user?.uid;
        if (!tenantId) {
            throw new CustomError(HttpRes.status.UNAUTHORIZED, HttpRes.message.UNAUTHORIZED, 'Tenant not authenticated');
        }
        // Get tenant email for notifications
        const tenant = await database.user.findUnique({
            where: { uid: tenantId },
            select: { email: true, id: true },
        });
        if (!tenant) {
            throw new CustomError(HttpRes.status.UNAUTHORIZED, HttpRes.message.UNAUTHORIZED, 'Tenant not found');
        }
        tenantEmail = tenant.email;
        // Call service
        const result = await uploadPropertyService(validatedData, tenant.id);
        propertyId = result.propertyId;
        // Send success email
        await sendPropertyUploadSuccessEmail({
            email: tenantEmail,
            propertyId: propertyId,
            payload: validatedData,
        });
        // Send success response
        res
            .status(HttpRes.status.CREATED)
            .json(ResponseHandler.success(HttpRes.message.CREATED, result));
    }
    catch (error) {
        // Send failure email if we have tenant email
        if (tenantEmail) {
            const errorMessage = error instanceof CustomError
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
