import crypto from 'crypto';
import env from '../../env.js';

/**
 * Verifies the signature key from Midtrans notification.
 * @param order_id - The order ID from the notification
 * @param status_code - The status code from the notification
 * @param gross_amount - The gross amount from the notification
 * @param signature_key - The signature key from the notification
 * @returns true if signature is valid, false otherwise
 */

export const verifyMidtransSignature = (
  order_id: string,
  status_code: string,
  gross_amount: string,
  signature_key: string,
): boolean => {
  const serverKey = env.MIDTRANS_SERVER_KEY;
  const hashString = order_id + status_code + gross_amount + serverKey;
  const expectedSignature = crypto
    .createHash('sha512')
    .update(hashString)
    .digest('hex');
  const isValid = expectedSignature === signature_key;

  return isValid;
};
