import { v2 as cloudinary } from 'cloudinary';
import env from '../../env.js';
import { CustomError } from '../utils/custom.error.js';
import { HttpRes } from '../constant/http.response.js';
cloudinary.config({
    cloud_name: env.CLOUD_NAME,
    api_key: env.CLOUD_API_KEY,
    api_secret: env.CLOUD_API_SECRET,
});
export const cloudinaryUploadPaymentProof = (file) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader
            .upload_stream({
            folder: env.CLOUD_PAYMENT_PROOF_FOLDER_PATH, // 👈 folder Cloudinary for payment proof
        }, (error, uploadResult) => {
            if (error) {
                return reject(error);
            }
            return resolve(uploadResult);
        })
            .end(file);
    });
};
export const cloudinaryUploadTempPropertyImage = (file, options = {}) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader
            .upload_stream({
            folder: `${env.CLOUD_TEMP_PROPERTIES_IMAGE_FOLDER_PATH}/${options.temp_group_id}`, // 👈 folder Cloudinary for property image
            ...options,
        }, (error, uploadResult) => {
            if (error) {
                return reject(error);
            }
            return resolve(uploadResult);
        })
            .end(file);
    });
};
export const cloudinaryDeleteTempPropertyImage = async (publicId) => {
    try {
        // Prepare File Path to Delete
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: 'image',
        });
        return result;
    }
    catch (error) {
        throw new CustomError(HttpRes.status.BAD_REQUEST, HttpRes.message.BAD_REQUEST, 'Failed to delete property image');
    }
};
export const cloudinaryMoveImage = async (fromPublicId, toPublicId) => {
    try {
        // Rename the image to move it to a new folder
        const result = await cloudinary.uploader.rename(fromPublicId, toPublicId, {
            overwrite: true,
        });
        return result;
    }
    catch (error) {
        throw new CustomError(HttpRes.status.INTERNAL_SERVER_ERROR, HttpRes.message.INTERNAL_SERVER_ERROR, 'Failed to move image in Cloudinary');
    }
};
export const cloudinaryUploadTenantProfileDocument = (file) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader
            .upload_stream({
            folder: env.CLOUD_TENANT_PROFILE_FOLDER_PATH, // 👈 folder Cloudinary for tenant profile documents
            resource_type: 'image', // for image files (JPEG, PNG, JPG, AVIF, WebP)
        }, (error, uploadResult) => {
            if (error) {
                return reject(error);
            }
            return resolve(uploadResult);
        })
            .end(file);
    });
};
