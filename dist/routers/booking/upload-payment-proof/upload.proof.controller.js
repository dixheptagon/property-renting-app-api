import database from '../../../lib/config/prisma.client.js';
import { CustomError } from '../../../lib/utils/custom.error.js';
import { HttpRes } from '../../../lib/constant/http.response.js';
import { cloudinaryUploadPaymentProof } from '../../../lib/config/cloudinary.js';
import { ResponseHandler } from '../../../lib/utils/response.handler.js';
export const UploadPaymentProofController = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        // Validate orderId
        if (!orderId) {
            throw new CustomError(HttpRes.status.BAD_REQUEST, HttpRes.message.BAD_REQUEST, 'Order ID is required');
        }
        // Get user from verifyToken middleware
        const userUid = req.user?.uid;
        if (!userUid) {
            throw new CustomError(HttpRes.status.UNAUTHORIZED, HttpRes.message.UNAUTHORIZED, 'User not authenticated');
        }
        // Find user by uid to get id
        const user = await database.user.findUnique({
            where: { uid: userUid },
            select: { id: true },
        });
        if (!user?.id) {
            throw new CustomError(HttpRes.status.UNAUTHORIZED, HttpRes.message.UNAUTHORIZED, 'User ID required');
        }
        // Find booking by uid (assuming orderId is uid)
        const booking = await database.booking.findUnique({
            where: { uid: orderId, user_id: user.id },
        });
        if (!booking) {
            throw new CustomError(HttpRes.status.NOT_FOUND, HttpRes.message.NOT_FOUND, 'Booking not found');
        }
        // Check if status is pending_payment
        if (booking.status !== 'pending_payment') {
            throw new CustomError(HttpRes.status.BAD_REQUEST, HttpRes.message.BAD_REQUEST, 'Payment proof can only be uploaded for bookings with pending_payment status');
        }
        // Check if file is uploaded
        if (!req.file) {
            throw new CustomError(HttpRes.status.BAD_REQUEST, HttpRes.message.BAD_REQUEST, 'Payment proof file is required');
        }
        // Upload to Cloudinary
        const uploadResult = (await cloudinaryUploadPaymentProof(req.file.buffer));
        if (!uploadResult || !uploadResult.secure_url) {
            throw new CustomError(HttpRes.status.INTERNAL_SERVER_ERROR, HttpRes.message.INTERNAL_SERVER_ERROR, 'Failed to upload payment proof to cloud storage');
        }
        // Update booking with payment proof URL and status to processing
        const updatedBooking = await database.booking.update({
            where: { uid: orderId },
            data: {
                payment_proof: uploadResult.secure_url,
                status: 'processing',
                paid_at: new Date(),
                payment_method: 'bank_transfer',
                cancellation_reason: null,
            },
        });
        // Send success response
        res.status(HttpRes.status.OK).json(ResponseHandler.success('Payment proof uploaded successfully', {
            payment_proof: updatedBooking.payment_proof,
        }));
    }
    catch (error) {
        next(error);
    }
};
