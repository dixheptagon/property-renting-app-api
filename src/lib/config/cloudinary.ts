import { v2 as cloudinary } from 'cloudinary';
import env from '../../env';
import { CustomError } from '../utils/custom.error';
import { HttpRes } from '../constant/http.response';

cloudinary.config({
  cloud_name: env.CLOUD_NAME,
  api_key: env.CLOUD_API_KEY,
  api_secret: env.CLOUD_API_SECRET,
});

export const cloudinaryUploadPaymentProof = (file: Buffer) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: env.CLOUD_PAYMENT_PROOF_FOLDER_PATH, // 👈 folder Cloudinary for payment proof
        },
        (error, uploadResult) => {
          if (error) {
            return reject(error);
          }
          return resolve(uploadResult);
        },
      )
      .end(file);
  });
};

export const cloudinaryUploadTempPropertyImage = (
  file: Buffer,
  options: { public_id?: string } = {},
) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: env.CLOUD_TEMP_PROPERTIES_IMAGE_FOLDER_PATH, // 👈 folder Cloudinary for property image
          ...options,
        },
        (error, uploadResult) => {
          if (error) {
            return reject(error);
          }
          return resolve(uploadResult);
        },
      )
      .end(file);
  });
};

export const cloudinaryDeleteTempPropertyImage = async (publicId: string) => {
  try {
    // Prepare File Path to Delete

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
    });

    return result;
  } catch (error) {
    throw new CustomError(
      HttpRes.status.BAD_REQUEST,
      HttpRes.message.BAD_REQUEST,
      'Failed to delete property image',
    );
  }
};
