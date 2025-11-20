# Property Renting App - Booking Payment Flow

This document outlines the payment integration for the property rental app using Midtrans Sandbox.

## Overview

The booking system supports one room per booking with no overlapping bookings allowed. Payments are handled via Midtrans, with webhooks for status updates.

## Database Schema

### Key Models

- **Booking**: Stores booking details, status (pending_payment, processing, cancelled, completed), payment info.
- **RoomUnavailability**: Blocks dates for booked rooms.
- **User**: Guest or tenant roles.

## API Endpoints

### 1. Create Order

**POST** `/api/booking/create-order`

Creates a new booking order and generates Midtrans payment token.

**Request Body:**

```json
{
  "user_id": 1,
  "room_id": 1,
  "property_id": 1,
  "check_in_date": "2025-10-01",
  "check_out_date": "2025-10-03",
  "fullname": "John Doe",
  "email": "john@example.com",
  "phone_number": "08123456789"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order": { ... },
    "transaction_token": "token_here"
  }
}
```

### 2. Order Notification Webhook

**POST** `/api/booking/order-notification`

Handles Midtrans payment notifications. Verifies signature and updates booking status atomically.

**Security:** Verifies signature using SHA512 hash of `order_id + status_code + gross_amount + server_key`.

**Response:** Always `200 OK` after processing.

### 3. Get Booking Status

**GET** `/api/booking/get-booking/:orderId?user_id=1`

Retrieves booking details. Accessible only by booking owner or admin (tenant role).

**Response:**

```json
{
  "success": true,
  "message": "Booking retrieved successfully",
  "data": {
    "id": 1,
    "uid": "ORDER-123",
    "status": "processing",
    "check_in_date": "2025-10-01",
    "check_out_date": "2025-10-03",
    "total_price": 500000,
    "fullname": "John Doe",
    "email": "john@example.com",
    "phone_number": "08123456789",
    "room": {
      "id": 1,
      "name": "Deluxe Room",
      "property": {
        "id": 1,
        "title": "Beach Villa",
        "address": "Jl. Pantai No. 1",
        "city": "Bali"
      }
    }
  }
}
```

## Business Logic

- **One Booking = One Room**: No multi-room bookings.
- **No Overlapping**: Checks room availability before creating booking.
- **Status Updates**:
  - `settlement`/`capture`: Update to `processing`, block dates in `room_unavailabilities`.
  - `expire`/`cancel`/`deny`: Update to `cancelled`.
- **Idempotency**: Safe for repeated webhook calls.

## Testing Instructions

1. **Setup Local Server**:

   ```bash
   npm install
   npm run dev
   ```

2. **Expose with ngrok**:

   ```bash
   ngrok http 2000  # or your port
   ```

3. **Configure Midtrans Sandbox**:
   - Set webhook URL to: `https://<ngrok-url>/api/booking/order-notification`
   - Use MIDTRANS_SERVER_KEY and MIDTRANS_CLIENT_KEY from .env

4. **Test Flow**:
   - Create order via API.
   - Use Midtrans Simulator to send notifications.
   - Verify booking status updates and room unavailabilities.

5. **Idempotency Test**:
   - Send the same notification payload multiple times.
   - Ensure no duplicate unavailabilities or status changes.

## Environment Variables

- `MIDTRANS_SERVER_KEY`: Midtrans server key
- `MIDTRANS_CLIENT_KEY`: Midtrans client key
- `NODE_ENV`: development/production

## Security Notes

- Server key is not logged.
- Signature verification prevents unauthorized updates.
- User authorization on status check endpoint.

## How to Use Order Notification Correctly

The order notification endpoint is a webhook that Midtrans calls automatically when payment status changes. To use it correctly:

### 1. Configure Webhook URL in Midtrans Dashboard

- Log in to your Midtrans Sandbox dashboard.
- Go to Settings > Configuration.
- Set the Payment Notification URL to: `https://your-domain.com/api/booking/order-notification`
- For local development, use ngrok: `ngrok http 8000` and use the ngrok URL.

### 2. Automatic Notifications

- Midtrans will send POST requests to the webhook URL with payment status updates.
- The endpoint verifies the signature to ensure authenticity.
- Booking status is updated automatically based on transaction_status:
  - `settlement` or `capture`: Booking status → `processing`, dates blocked.
  - `expire`, `cancel`, or `deny`: Booking status → `cancelled`.

### 3. Testing with Midtrans Simulator

- In Midtrans dashboard, go to Simulator.
- Create a test transaction with your order_id.
- Use the simulator to change payment status (settlement, cancel, etc.).
- The webhook will be triggered automatically.

### 4. Manual Testing (Development Only)

If you need to test manually, send a POST request to `/api/booking/order-notification` with this payload structure:

```json
{
  "order_id": "ORDER-123",
  "transaction_status": "settlement",
  "fraud_status": "accept",
  "status_code": "200",
  "gross_amount": "100000.00",
  "signature_key": "generated_signature"
}
```

To generate `signature_key` for testing:

- Concatenate: `order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY`
- Compute SHA512 hash of the string.
- Example (using Node.js):
  ```javascript
  const crypto = require('crypto');
  const hashString = 'ORDER-123' + '200' + '100000.00' + 'your_server_key';
  const signature = crypto
    .createHash('sha512')
    .update(hashString)
    .digest('hex');
  ```

**Note:** Manual testing should only be used for development. In production, rely on Midtrans notifications.

### 5. Debugging Signature Issues

- Check server logs for signature verification details.
- Ensure MIDTRANS_SERVER_KEY matches your Midtrans account.
- Verify payload fields match exactly (gross_amount as string, etc.).
- Use the logged hash string and expected signature to compare with Midtrans documentation.
