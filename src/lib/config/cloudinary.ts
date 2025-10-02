import { v2 as cloudinary } from 'cloudinary';
import env from '../../env';

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
