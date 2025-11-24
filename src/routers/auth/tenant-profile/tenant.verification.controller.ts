import { Request, Response, NextFunction } from 'express';
import database from '../../../lib/config/prisma.client.js';
import { ResponseHandler } from '../../../lib/utils/response.handler.js';
import { HttpRes } from '../../../lib/constant/http.response.js';
import { cloudinaryUploadTenantProfileDocument } from '../../../lib/config/cloudinary.js';
import { CustomError } from '../../../lib/utils/custom.error.js';
import { TenantVerificationSchema } from './tenant.verification.validation.js';
import { sendTenantVerifiedEmail } from './send.email.tenant.verified.js';

export const TenantVerificationController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res
        .status(HttpRes.status.UNAUTHORIZED)
        .json(ResponseHandler.error('Unauthorized', 'User not authenticated'));
    }

    const { contact, address, city, country, government_id_type } = req.body;
    const file = req.file;

    // Validate request body
    try {
      await TenantVerificationSchema.validate({
        contact,
        address,
        city,
        country,
        government_id_type,
      });
    } catch (validationError: any) {
      return res
        .status(HttpRes.status.UNPROCESSABLE_ENTITY)
        .json(
          ResponseHandler.error('Validation Error', validationError.errors),
        );
    }

    if (!file) {
      return res
        .status(HttpRes.status.BAD_REQUEST)
        .json(
          ResponseHandler.error(
            'Validation Error',
            'Government ID file is required',
          ),
        );
    }

    // Upload file to Cloudinary
    let uploadResult;
    try {
      uploadResult = await cloudinaryUploadTenantProfileDocument(file.buffer);
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);
      throw new CustomError(
        HttpRes.status.INTERNAL_SERVER_ERROR,
        HttpRes.message.INTERNAL_SERVER_ERROR,
        'Failed to upload government ID document',
      );
    }

    // find user by UId (outside transaction for email access)
    const user = await database.user.findUnique({
      where: { uid: userId },
      select: { role: true, id: true, email: true },
    });

    if (!user) {
      throw new CustomError(
        HttpRes.status.UNAUTHORIZED,
        HttpRes.message.UNAUTHORIZED,
        'User not found',
      );
    }

    // Use transaction to ensure data consistency
    const result = await database.$transaction(async (tx) => {
      // Create or update tenant profile
      const tenantProfile = await tx.tenantProfile.upsert({
        where: {
          user_id: user.id,
        },
        update: {
          contact,
          address,
          city,
          country,
          government_id_type,
          government_id_path: (uploadResult as any).secure_url,
          verified: true, // Reset verification status when new document is uploaded
          verified_at: null,
          updated_at: new Date(),
        },
        create: {
          user_id: user.id,
          contact,
          address,
          city,
          country,
          government_id_type,
          government_id_path: (uploadResult as any).secure_url,
          verified: true, // Set verification status to true when document is uploaded for the first time
          balance: 0,
        },
      });

      // update user role to tenant
      await tx.user.update({
        where: { uid: userId },
        data: { role: 'tenant' },
      });

      return tenantProfile;
    });

    // Send verification success email (outside transaction to avoid email failure breaking the transaction)
    try {
      await sendTenantVerifiedEmail({
        email: user.email,
        userId: userId,
        tenantProfileId: result.id,
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't throw error - email failure shouldn't break the verification process
    }

    // Response
    const response = {
      tenantProfile: {
        id: result.id,
        user_id: result.user_id,
        contact: result.contact,
        address: result.address,
        city: result.city,
        country: result.country,
        government_id_type: result.government_id_type,
        government_id_path: result.government_id_path,
        verified: result.verified,
        created_at: result.created_at,
        updated_at: result.updated_at,
      },
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
      },
    };

    return res
      .status(HttpRes.status.OK)
      .json(
        ResponseHandler.success(
          'Verification submitted successfully',
          response,
        ),
      );
  } catch (error) {
    next(error);
  }
};
