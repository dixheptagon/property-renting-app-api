import multer from 'multer';
import { CustomError } from '../utils/custom.error.js';
import { HttpRes } from '../constant/http.response.js';
export const uploadPaymentProof = () => {
    const storage = multer.memoryStorage();
    return multer({
        storage: storage,
        limits: { fileSize: 1 * 1024 * 1024 }, // limit file size 1MB
        fileFilter: (req, file, cb) => {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            }
            else {
                cb(new CustomError(HttpRes.status.BAD_REQUEST, HttpRes.message.BAD_REQUEST, 'Invalid file type : only image are allowed'));
            }
        },
    });
};
export const uploadPropertyImage = () => {
    const storage = multer.memoryStorage();
    return multer({
        storage: storage,
        limits: { fileSize: 5 * 1024 * 1024 }, // limit file size 5MB
        fileFilter: (req, file, cb) => {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            }
            else {
                cb(new CustomError(HttpRes.status.BAD_REQUEST, HttpRes.message.BAD_REQUEST, 'Invalid file type: only images are allowed'));
            }
        },
    });
};
export const uploadTenantProfileDocument = () => {
    const storage = multer.memoryStorage();
    return multer({
        storage: storage,
        limits: { fileSize: 1 * 1024 * 1024 }, // limit file size 1MB
        fileFilter: (req, file, cb) => {
            const allowedMimes = [
                'image/jpeg',
                'image/png',
                'image/jpg',
                'image/avif',
                'image/webp',
            ];
            if (allowedMimes.includes(file.mimetype)) {
                cb(null, true);
            }
            else {
                cb(new CustomError(HttpRes.status.BAD_REQUEST, HttpRes.message.BAD_REQUEST, 'Invalid file type: only JPEG, PNG, JPG, AVIF, and WebP files are allowed'));
            }
        },
    });
};
