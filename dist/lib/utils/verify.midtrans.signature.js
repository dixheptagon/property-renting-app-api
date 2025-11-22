"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyMidtransSignature = void 0;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = __importDefault(require("../../env"));
/**
 * Verifies the signature key from Midtrans notification.
 * @param order_id - The order ID from the notification
 * @param status_code - The status code from the notification
 * @param gross_amount - The gross amount from the notification
 * @param signature_key - The signature key from the notification
 * @returns true if signature is valid, false otherwise
 */
const verifyMidtransSignature = (order_id, status_code, gross_amount, signature_key) => {
    const serverKey = env_1.default.MIDTRANS_SERVER_KEY;
    const hashString = order_id + status_code + gross_amount + serverKey;
    const expectedSignature = crypto_1.default
        .createHash('sha512')
        .update(hashString)
        .digest('hex');
    const isValid = expectedSignature === signature_key;
    if (!isValid) {
        console.log('Signature verification failed');
        console.log('Hash string:', hashString);
        console.log('Expected signature:', expectedSignature);
        console.log('Received signature_key:', signature_key);
    }
    return isValid;
};
exports.verifyMidtransSignature = verifyMidtransSignature;
