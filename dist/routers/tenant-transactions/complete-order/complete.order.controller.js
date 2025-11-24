import database from '../../../lib/config/prisma.client.js';
import { CustomError } from '../../../lib/utils/custom.error.js';
import { HttpRes } from '../../../lib/constant/http.response.js';
import { ResponseHandler } from '../../../lib/utils/response.handler.js';
export const CompleteOrderController = async (req, res, next) => {
    try {
        // Get order ID from URL params
        const { orderId } = req.params;
        if (!orderId ||
            typeof orderId !== 'string' ||
            !orderId.startsWith('ORDER-')) {
            throw new CustomError(HttpRes.status.BAD_REQUEST, HttpRes.message.BAD_REQUEST, 'Invalid order ID format. Expected format: ORDER-xxxxx');
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
        // Find booking with property details
        const booking = await database.booking.findUnique({
            where: { uid: orderId },
            include: {
                property: true,
            },
        });
        if (!booking) {
            throw new CustomError(HttpRes.status.NOT_FOUND, HttpRes.message.NOT_FOUND, 'Booking not found');
        }
        // Check if tenant owns the property
        if (booking.property.user_id !== user.id) {
            throw new CustomError(HttpRes.status.FORBIDDEN, HttpRes.message.FORBIDDEN, 'Access denied. You can only complete orders for your own properties.');
        }
        // Check if booking is in confirmed status
        if (booking.status !== 'confirmed') {
            throw new CustomError(HttpRes.status.BAD_REQUEST, HttpRes.message.BAD_REQUEST, `Cannot complete booking. Current status: ${booking.status}. Only confirmed bookings can be completed.`);
        }
        // Check if current date is on or after check-out date
        const currentDate = new Date();
        const checkOutDate = new Date(booking.check_out_date);
        if (currentDate < checkOutDate) {
            throw new CustomError(HttpRes.status.BAD_REQUEST, HttpRes.message.BAD_REQUEST, `Cannot complete booking before check-out date. Check-out date: ${checkOutDate.toISOString().split('T')[0]}, Current date: ${currentDate.toISOString().split('T')[0]}`);
        }
        // Update booking status to completed
        const updatedBooking = await database.booking.update({
            where: { uid: orderId },
            data: {
                status: 'completed',
            },
        });
        res.status(HttpRes.status.OK).json(ResponseHandler.success('Booking completed successfully.', {
            booking_id: updatedBooking.id,
            order_uid: updatedBooking.uid,
            status: updatedBooking.status,
            completed_at: new Date().toISOString(),
        }));
    }
    catch (error) {
        console.error('Error in CompleteOrderController:', error);
        next(error);
    }
};
