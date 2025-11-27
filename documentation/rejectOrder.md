# Reject Order Feature Implementation

## Overview

This document contains the implementation of the Reject Order feature for the property renting app API. The feature allows tenants to reject bookings that are in `processing` status (after payment proof has been uploaded). When rejected, the booking status reverts to `pending_payment`, the payment proof is cleared, a new 2-hour payment deadline is set, and a rejection email is sent to the guest.

## Requirements

- Endpoint: `POST /tenant/:orderId/reject-order`
- Only tenants can reject orders for their own properties
- Only reject bookings with status `processing`
- Revert status to `pending_payment` with new 2-hour deadline
- Clear existing payment proof
- Send rejection email notification to guest
- Order ID must follow format: `ORDER-xxxxx`

## Dependencies

The feature uses the following dependencies:

- `handlebars` for email template compilation
- `nodemailer` for email sending
- Database access via Prisma client
- Email templates located in `src/lib/template/`

## Express Route Handler Implementation

### File: `src/routers/tenant-transactions/reject-order/reject.order.controller.ts`

## Prisma Query for Updating Order Status

The Prisma query used in the controller:

```typescript
const updatedBooking = await database.booking.update({
  where: { uid: orderId },
  data: {
    status: 'pending_payment',
    payment_proof: null, // Clear the payment proof since it was rejected
    payment_deadline: payment_deadline,
  },
});
```

## Email Service Implementation

### File: `src/routers/tenant-transactions/reject-order/send.rejection.service.ts`

The service uses Handlebars templating to send rejection emails with booking details.

### Email Template: `src/lib/template/rejected.booking.html`

The email template includes:

- Booking rejection notice with 2-hour deadline warning
- Property and room details
- Guest information
- Payment information with new deadline
- Action required instructions for uploading new payment proof
- Contact support information

## HTTP Response Examples

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Booking rejected successfully. Rejection email sent to guest. Guest has 2 hours to upload new payment proof.",
  "data": {
    "booking_id": 123,
    "order_uid": "ORDER-ABC123",
    "status": "pending_payment",
    "payment_deadline": "2024-01-15T10:30:00.000Z"
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
  "message": "Access denied. You can only reject orders for your own properties.",
  "data": null
}
```

#### 400 Bad Request (Invalid status)

```json
{
  "success": false,
  "message": "Cannot reject booking. Current status: confirmed. Only processing bookings can be rejected.",
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
// Reject Order by Tenant
tenantRouter.post(
  '/tenant/:orderId/reject-order',
  RejectOrderController as any,
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
6. **Status Validation**: Only allow rejection of bookings in `processing` status
7. **Status Update**: Change status to `pending_payment`, clear payment proof, set new 2-hour deadline
8. **Email Notification**: Send rejection email to guest (non-blocking - failure doesn't affect rejection)
9. **Response**: Return success with updated booking details

## Email Template Data Structure

The rejection email template receives the following data:

```typescript
const templateData = {
  order_id: booking.uid || `BK${booking.id.toString().padStart(10, '0')}`,
  property_title: booking.property.title,
  property_address: `${booking.property.address}, ${booking.property.city}, ${booking.property.country} ${booking.property.postal_code}`,
  room_name: booking.room.name,
  check_in_date: checkInDate, // Formatted date
  check_out_date: checkOutDate, // Formatted date
  fullname: booking.fullname,
  email: booking.email,
  phone_number: booking.phone_number,
  total_price: formattedPrice, // IDR currency format
  payment_deadline: paymentDeadline, // Formatted date/time
  current_year: new Date().getFullYear(),
};
```

## Notes

- The rejection process gives guests a second chance by resetting the payment deadline to 2 hours
- Email sending is non-blocking - if email fails, the rejection still succeeds
- The payment proof is cleared to allow guests to upload a new one
- Error handling follows the existing pattern in the codebase with CustomError class
- The feature integrates with the existing auto-cancel mechanism for expired payment deadlines
- Logging is included for email sending failures in the console
