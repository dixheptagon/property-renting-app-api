# Confirm Order by Tenant Feature Implementation

## Overview

This document contains the implementation of the Confirm Order by Tenant feature for the property renting app API. The feature allows tenants to confirm bookings that are in `processing` status (after payment proof has been uploaded and verified). When confirmed, the booking status changes to `confirmed`, and a confirmation email with booking details and guest guidelines is sent to the guest.

## Requirements

- Endpoint: `POST /tenant/:orderId/confirm-order`
- Only tenants can confirm orders for their own properties
- Only confirm bookings with status `processing`
- Change status to `confirmed`
- Clear any cancellation reason
- Send confirmation email notification to guest with booking details and guest guidelines PDF attachment
- Order ID must follow format: `ORDER-xxxxx`

## Dependencies

The feature uses the following dependencies:

- `handlebars` for email template compilation
- `nodemailer` for email sending
- Database access via Prisma client
- Email templates located in `src/lib/template/`
- Guest guidelines PDF attachment from `src/lib/template/assets/guest-guidelines.pdf`

## Express Route Handler Implementation

### File: `src/routers/tenant-transactions/confirm-order/confirm.order.controller.ts`

## Prisma Query for Updating Order Status

The Prisma query used in the controller:

```typescript
const updatedBooking = await database.booking.update({
  where: { uid: orderId },
  data: {
    status: 'confirmed',
    cancellation_reason: null,
  },
});
```

## Email Service Implementation

### File: `src/routers/tenant-transactions/confirm-order/send.confirmation.service.ts`

The service uses Handlebars templating to send confirmation emails with comprehensive booking details.

### Email Template: `src/lib/template/confirmed.booking.html`

The email template includes:

- Booking confirmation notice with check-in/out instructions
- Property and room details
- Stay duration and capacity information
- Guest information
- Payment details
- Guest guidelines PDF attachment
- Contact support information

## HTTP Response Examples

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Booking confirmed successfully. Confirmation email sent to guest.",
  "data": {
    "booking_id": 123,
    "order_uid": "ORDER-ABC123",
    "status": "confirmed",
    "confirmed_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### Error Responses

#### 400 Bad Request (Invalid order ID format)

```json
{
  "success": false,
  "message": "Invalid order ID format. Expected format: ORDER-xxxxx",
  "data": null
}
```

#### 403 Forbidden (Not property owner)

```json
{
  "success": false,
  "message": "Access denied. You can only confirm orders for your own properties.",
  "data": null
}
```

#### 400 Bad Request (Invalid status)

```json
{
  "success": false,
  "message": "Cannot confirm booking. Current status: pending_payment. Only processing bookings can be confirmed.",
  "data": null
}
```

#### 404 Not Found (Order doesn't exist)

```json
{
  "success": false,
  "message": "Booking not found",
  "data": null
}
```

## Route Configuration

The route is configured in `src/routers/tenant-transactions/tenant.route.ts`:

```typescript
// Confirm Order by Tenant
tenantRouter.post(
  '/tenant/:orderId/confirm-order',
  ConfirmOrderController as any,
);
```

The route uses the following middleware:

- `verifyToken`: Ensures user is authenticated
- `verifyTenant`: Ensures user has tenant role

## Business Logic Summary

1. **Authentication & Authorization**: Verify user is authenticated and has tenant role
2. **Input Validation**: Validate order ID format (ORDER-xxxxx)
3. **User Verification**: Get user ID from authenticated user UID
4. **Booking Lookup**: Find booking with property details included
5. **Ownership Check**: Ensure tenant owns the property associated with the booking
6. **Status Validation**: Only allow confirmation of bookings in `processing` status
7. **Status Update**: Change status to `confirmed` and clear cancellation reason
8. **Email Notification**: Send confirmation email to guest with booking details and guest guidelines PDF (non-blocking - failure doesn't affect confirmation)
9. **Response**: Return success with updated booking details

## Email Template Data Structure

The confirmation email template receives the following data:

```typescript
const templateData = {
  order_id: booking.uid || `BK${booking.id.toString().padStart(10, '0')}`,
  property_title: booking.property.title,
  property_address: `${booking.property.address}, ${booking.property.city}, ${booking.property.country} ${booking.property.postal_code}`,
  room_name: booking.room.name,
  check_in_date: checkInDate, // Formatted date
  check_out_date: checkOutDate, // Formatted date
  duration: duration, // Calculated nights
  capacity: booking.room.max_guest,
  fullname: booking.fullname,
  email: booking.email,
  phone_number: booking.phone_number,
  total_price: formattedPrice, // IDR currency format
  payment_method: booking.payment_method || 'Bank Transfer',
  paid_at: paidAt, // Formatted date/time or 'N/A'
  current_year: new Date().getFullYear(),
};
```

## Email Attachments

The confirmation email includes a PDF attachment:

```typescript
const attachment = [
  {
    filename: 'guest-guidelines.pdf',
    path: path.join(
      __dirname,
      '../../../lib/template/assets/guest-guidelines.pdf',
    ),
    contentType: 'application/pdf',
  },
];
```

## Notes

- The confirmation process finalizes the booking after payment verification
- Email sending is non-blocking - if email fails, the confirmation still succeeds
- The cancellation_reason is cleared to ensure clean booking state
- Error handling follows the existing pattern in the codebase with CustomError class
- The email includes comprehensive booking details and check-in instructions
- Guest guidelines PDF is attached to provide important information for guests
- Logging is included for email sending failures in the console
