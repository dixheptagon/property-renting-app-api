import database from '../../../lib/config/prisma.client.js';
import { verifyMidtransSignature } from '../../../lib/utils/verify.midtrans.signature.js';
import { CustomError } from '../../../lib/utils/custom.error.js';
import { HttpRes } from '../../../lib/constant/http.response.js';
import { ResponseHandler } from '../../../lib/utils/response.handler.js';
export const OrderNotificationController = async (req, res, next) => {
    try {
        const notificationJson = req.body;
        // Parse required fields
        const { order_id, transaction_status, fraud_status, status_code, gross_amount, signature_key, payment_type, } = notificationJson;
        // Verify signature
        const isSignatureValid = verifyMidtransSignature(order_id, status_code, gross_amount.toString(), signature_key);
        if (!isSignatureValid) {
            throw new CustomError(HttpRes.status.UNAUTHORIZED, HttpRes.message.UNAUTHORIZED, `Invalid Midtrans signature for order_id: ${order_id}`);
        }
        // Find booking by uid (order_id)
        const booking = await database.booking.findUnique({
            where: { uid: order_id },
            include: { room: true, property: true },
        });
        if (!booking) {
            // still respond 200 to acknowledge receipt
            throw new CustomError(HttpRes.status.OK, HttpRes.message.OK, `Booking not found for order_id: ${order_id}`);
        }
        // Use transaction for atomicity
        await database.$transaction(async (tx) => {
            if (transaction_status === 'settlement' ||
                transaction_status === 'capture') {
                // Only update if still pending_payment
                if (booking.status === 'pending_payment') {
                    // Update booking status to processing
                    await tx.booking.update({
                        where: { id: booking.id },
                        data: {
                            status: 'processing',
                            paid_at: new Date(),
                            payment_method: payment_type,
                        },
                    });
                }
                else {
                    console.log('Booking status not pending_payment, skipping update');
                }
            }
            else if (transaction_status === 'expire' ||
                transaction_status === 'cancel' ||
                transaction_status === 'deny') {
                console.log('Transaction status is expire/cancel/deny, booking status:', booking.status);
                // Only update if still pending_payment
                if (booking.status === 'pending_payment') {
                    console.log('Updating booking to cancelled');
                    await tx.booking.update({
                        where: { id: booking.id },
                        data: { status: 'cancelled' },
                    });
                }
                else {
                    console.log('Booking status not pending_payment, skipping cancellation update');
                }
            }
            else {
                console.log('Transaction status not handled:', transaction_status);
            }
            // For other statuses like pending, etc., do nothing
        });
        console.log('Transaction completed for order_id:', order_id);
        const bookingResponse = 
        // Alaways respond 200 OK
        res
            .status(HttpRes.status.OK)
            .json(ResponseHandler.success(HttpRes.message.OK + ' : Transaction Successfull', 'Check your inbox and email for more details'));
    }
    catch (error) {
        console.error('Error processing Midtrans notification:', error);
        // Still respond 200 to prevent retries, but log error
        res.status(200).json({ message: 'OK' });
    }
};
