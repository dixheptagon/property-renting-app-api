"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadTenantProfileDocument = exports.uploadPropertyImage = exports.uploadPaymentProof = void 0;
const multer_1 = __importDefault(require("multer"));
const custom_error_1 = require("../utils/custom.error");
const http_response_1 = require("../constant/http.response");
const uploadPaymentProof = () => {
    const storage = multer_1.default.memoryStorage();
    return (0, multer_1.default)({
        storage: storage,
        limits: { fileSize: 1 * 1024 * 1024 }, // limit file size 1MB
        fileFilter: (req, file, cb) => {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            }
            else {
                cb(new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Invalid file type : only image are allowed'));
            }
        },
    });
};
exports.uploadPaymentProof = uploadPaymentProof;
const uploadPropertyImage = () => {
    const storage = multer_1.default.memoryStorage();
    return (0, multer_1.default)({
        storage: storage,
        limits: { fileSize: 5 * 1024 * 1024 }, // limit file size 5MB
        fileFilter: (req, file, cb) => {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            }
            else {
                cb(new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Invalid file type: only images are allowed'));
            }
        },
    });
};
exports.uploadPropertyImage = uploadPropertyImage;
const uploadTenantProfileDocument = () => {
    const storage = multer_1.default.memoryStorage();
    return (0, multer_1.default)({
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
                cb(new custom_error_1.CustomError(http_response_1.HttpRes.status.BAD_REQUEST, http_response_1.HttpRes.message.BAD_REQUEST, 'Invalid file type: only JPEG, PNG, JPG, AVIF, and WebP files are allowed'));
            }
        },
    });
};
exports.uploadTenantProfileDocument = uploadTenantProfileDocument;
