import { Request } from 'express';
import multer from 'multer';
import { CustomError } from '../utils/custom.error';
import { HttpRes } from '../constant/http.response';

export const uploadPaymentProof = () => {
  const storage = multer.memoryStorage();

  return multer({
    storage: storage,
    limits: { fileSize: 1 * 1024 * 1024 }, // limit file size 1MB
    fileFilter: (req: Request, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(
          new CustomError(
            HttpRes.status.BAD_REQUEST,
            HttpRes.message.BAD_REQUEST,
            'Invalid file type : only image are allowed',
          ),
        );
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
      } else {
        cb(
          new CustomError(
            HttpRes.status.BAD_REQUEST,
            HttpRes.message.BAD_REQUEST,
            'Invalid file type: only images are allowed',
          ),
        );
      }
    },
  });
};
