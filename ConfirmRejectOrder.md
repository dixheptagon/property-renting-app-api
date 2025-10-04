# Confirm/Reject Order by Tenant API

## Endpoints

### Confirm Order

POST /tenant/:orderId/confirm-order

### Reject Order

POST /tenant/:orderId/reject-order

## Description

These endpoints allow authenticated tenants to confirm or reject payment proofs submitted by guests for their property bookings. When a tenant confirms a payment, the booking status changes to confirmed and a confirmation email is sent to the guest. When rejected, the booking status reverts to pending_payment and the guest receives a rejection email with instructions to upload a new payment proof within 2 hours.

## Authentication

Requires authentication with tenant role.

## Testing with Dummy Authentication

For testing purposes, the endpoints use a dummy authentication middleware that reads user information from the `x-user` header. Include this header in your requests:

```
x-user: {"id": 1, "email": "tenant@example.com", "role": "tenant"}
```

Replace the `id` with a valid tenant user ID from your database.

## URL Parameters

- `orderId` (required): The booking UID (string) to confirm or reject. Format: ORDER-xxxxx (e.g., ORDER-858f1f8e-2305-42bd-816c-942b47d461c6)

## Request Body

Both endpoints do not require a request body.

## Response

### Success (200) - Confirm Order

```json
{
  "success": true,
  "message": "Booking confirmed successfully. Confirmation email sent to guest.",
  "data": {
    "booking_id": 123,
    "order_uid": "ORDER-ABC123",
    "status": "confirmed",
    "confirmed_at": "2024-10-04T07:31:30.000Z"
  }
}
```

### Success (200) - Reject Order

```json
{
  "success": true,
  "message": "Booking rejected successfully. Rejection email sent to guest. Guest has 2 hours to upload new payment proof.",
  "data": {
    "booking_id": 123,
    "order_uid": "ORDER-ABC123",
    "status": "pending_payment",
    "payment_deadline": "2024-10-04T09:31:30.000Z"
  }
}
```

### Error (400) - Invalid Order ID

```json
{
  "success": false,
  "message": "Invalid order ID format. Expected format: ORDER-xxxxx"
}
```

### Error (400) - Invalid Booking Status

```json
{
  "success": false,
  "message": "Cannot confirm booking. Current status: confirmed. Only processing bookings can be confirmed."
}
```

### Error (401) - Authentication Required

```json
{
  "success": false,
  "message": "Authentication required"
}
```

### Error (403) - Access Denied - Not Tenant

```json
{
  "success": false,
  "message": "Access denied. Tenant role required."
}
```

### Error (403) - Access Denied - Wrong Property Owner

```json
{
  "success": false,
  "message": "Access denied. You can only confirm orders for your own properties."
}
```

### Error (404) - Booking Not Found

```json
{
  "success": false,
  "message": "Booking not found"
}
```

## Business Rules

### Confirm Order

- Only tenants who own the property linked to the booking can confirm orders.
- Booking must be in "processing" status to be confirmed.
- Upon confirmation, booking status changes to "confirmed".
- The `paid_at` timestamp is set to the current time.
- A confirmation email is sent to the guest with booking details and property rules.
- Email sending failures do not affect the confirmation process.

### Reject Order

- Only tenants who own the property linked to the booking can reject orders.
- Booking must be in "processing" status to be rejected.
- Upon rejection, booking status reverts to "pending_payment".
- The payment proof is cleared from the booking record.
- A rejection email is sent to the guest explaining the issue and giving them 2 hours to upload a new payment proof.
- Email sending failures do not affect the rejection process.

## Email Notifications

### Confirmation Email

- Subject: "Your booking has been confirmed - [Order ID]"
- Includes: Booking details, property information, check-in/out dates, payment information, and property rules & guidelines.
- Uses Handlebars template: `confirmed.booking.html`

### Rejection Email

- Subject: "Payment Proof Rejected - [Order ID]"
- Includes: Booking details, rejection reason, deadline for new payment proof upload, and instructions.
- Uses Handlebars template: `rejected.booking.html`

## Implementation Details

- **Confirm Controller**: `ConfirmOrderController` in `src/routers/tenant-transactions/confirm-order/confirm.order.controller.ts`
- **Reject Controller**: `RejectOrderController` in `src/routers/tenant-transactions/reject-order/reject.order.controller.ts`
- **Email Service**: `BookingEmailService` in `src/routers/tenant-transactions/utils/booking.email.service.ts`
- Uses Prisma ORM for database operations.
- Follows clean architecture with separation of concerns.
- Email templates use Handlebars for dynamic content rendering.
- Error handling ensures database consistency even if email sending fails.

## Dependencies

- Nodemailer for email sending
- Handlebars for email template rendering
- Prisma Client for database operations
- Express.js for HTTP routing
- Custom error handling and response utilities

## Testing

To test these endpoints:

1. Create a booking and upload payment proof to get it to "processing" status.
2. Use a tenant user ID that owns the property in the booking.
3. Make POST requests to the respective endpoints with proper authentication headers.
4. Verify database status changes and email delivery (check logs for email sending).
