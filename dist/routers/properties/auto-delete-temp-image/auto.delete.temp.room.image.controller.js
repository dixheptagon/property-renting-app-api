"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoDeleteTempRoomImage = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_client_1 = __importDefault(require("../../../lib/config/prisma.client"));
const cloudinary_1 = require("../../../lib/config/cloudinary");
const extractPublicIdFromUrl = (url) => {
    try {
        const urlParts = url.split('/');
        const uploadIndex = urlParts.findIndex((part) => part === 'upload');
        if (uploadIndex === -1)
            return null;
        let afterUpload = urlParts.slice(uploadIndex + 1);
        if (afterUpload[0] &&
            afterUpload[0].startsWith('v') &&
            /^\d+$/.test(afterUpload[0].slice(1))) {
            afterUpload = afterUpload.slice(1);
        }
        const publicIdWithExt = afterUpload.join('/');
        return publicIdWithExt.replace(/\.[^/.]+$/, '');
    }
    catch (error) {
        console.error('Error extracting public_id from URL:', error);
        return null;
    }
};
// Auto-delete temp room images cron job
const AutoDeleteTempRoomImage = () => {
    // Run daily at 02:00 server time
    node_cron_1.default.schedule('0 2 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Calculate date 7 days ago
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const tempImages = yield prisma_client_1.default.roomImage.findMany({
                where: {
                    status: 'temp',
                    updated_at: {
                        lt: sevenDaysAgo,
                    },
                },
            });
            for (const image of tempImages) {
                try {
                    let publicId = image.public_id;
                    // If public_id is not present, extract from URL
                    if (!publicId) {
                        publicId = extractPublicIdFromUrl(image.url);
                    }
                    // Delete from Cloudinary if public_id is available
                    if (publicId) {
                        yield (0, cloudinary_1.cloudinaryDeleteTempPropertyImage)(publicId);
                    }
                    else {
                        console.warn(`Could not extract public_id for image ID ${image.id}, URL: ${image.url}`);
                    }
                    // Delete from database
                    yield prisma_client_1.default.roomImage.delete({
                        where: { id: image.id },
                    });
                }
                catch (error) {
                    console.error(`Error deleting image ID ${image.id}:`, error);
                    // Continue with next image even if one fails
                }
            }
        }
        catch (error) {
            console.error('Error in auto-delete temp room images cron job:', error);
        }
    }));
};
exports.AutoDeleteTempRoomImage = AutoDeleteTempRoomImage;
