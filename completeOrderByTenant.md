# Complete Order by Tenant Feature Implementation

## Overview

This document contains the implementation of the Complete Order by Tenant feature for the property renting app API. The feature allows tenants to manually complete bookings that are in `confirmed` status and have passed their check-out date. Additionally, it includes an automatic completion mechanism that runs daily to complete bookings that have been checked out for 6 hours or more.

## Requirements

- Endpoint: `POST /tenant/:orderId/complete-order`
- Only tenants can complete orders for their own properties
- Only complete bookings with status `confirmed`
- Current date must be on or after the check-out date for manual completion
- Automatic completion runs daily at midnight for bookings checked out 6+ hours ago
- Order ID must follow format: `ORDER-xxxxx`

## Dependencies

The feature uses the following dependencies:

- `node-cron` for scheduling automatic completion jobs
- Database access via Prisma client

## Express Route Handler Implementation

### File: `src/routers/tenant-transactions/complete-order/complete.order.controller.ts`

## Prisma Query for Updating Order Status

The Prisma query used in the controller:

```typescript
const updatedBooking = await database.booking.update({
  where: { uid: orderId },
  data: {
    status: 'completed',
  },
});
```

## Automatic Completion Implementation

### File: `src/routers/tenant-transactions/auto-complete-order/auto.complete.order.controller.ts`

The automatic completion uses node-cron to schedule a daily job at midnight that:

1. Finds all bookings with status `confirmed` and check-out date more than 6 hours ago
2. Updates their status to `completed`
3. Logs each completion and handles errors gracefully

### Cron Schedule Configuration

```typescript
cron.schedule('0 0 * * *', async () => {
  // Daily at 00:00 server time
});
```

### Automatic Completion Query

```typescript
const bookingsToComplete = await database.booking.findMany({
  where: {
    status: 'confirmed',
    check_out_date: {
      lt: sixHoursAgo, // 6 hours ago from current time
    },
  },
});
```

## HTTP Response Examples

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Booking completed successfully.",
  "data": {
    "booking_id": 123,
    "order_uid": "ORDER-ABC123",
    "status": "completed",
    "completed_at": "2025-10-06T08:49:32.117Z"
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

#### 403 Forbidden (Not a tenant)

```json
{
  "success": false,
  "message": "Access denied. Tenant role required.",
  "data": null
}
```

#### 403 Forbidden (Not property owner)

```json
{
  "success": false,
  "message": "Access denied. You can only complete orders for your own properties.",
  "data": null
}
```

#### 400 Bad Request (Invalid status)

```json
{
  "success": false,
  "message": "Cannot complete booking. Current status: pending_payment. Only confirmed bookings can be completed.",
  "data": null
}
```

#### 400 Bad Request (Before check-out date)

```json
{
  "success": false,
  "message": "Cannot complete booking before check-out date. Check-out date: 2025-10-10, Current date: 2025-10-08",
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
// Complete Order by Tenant
tenantRouter.post(
  '/tenant/:orderId/complete-order',
  CompleteOrderController as any,
);
```

The route uses the following middleware:

- `verifyToken`: Ensures user is authenticated
- `verifyTenant`: Ensures user has tenant role

## App Initialization

The automatic completion cron job is initialized in `src/app.ts`:

```typescript
// Initialize auto-complete cron job
import { AutoCompleteOrderController } from './routers/tenant-transactions/auto-complete-order/auto.complete.order.controller';
AutoCompleteOrderController();
```

## Business Logic Summary

### Manual Completion

1. **Authentication & Authorization**: Verify user is authenticated, has tenant role
2. **Input Validation**: Validate order ID format (ORDER-xxxxx)
3. **Booking Lookup**: Find booking with property details included
4. **Ownership Check**: Ensure tenant owns the property associated with the booking
5. **Status Validation**: Only allow completion of bookings in `confirmed` status
6. **Date Validation**: Ensure current date is on or after check-out date
7. **Status Update**: Change status to `completed`
8. **Response**: Return success with updated booking details

### Automatic Completion

1. **Scheduling**: Runs daily at midnight via cron job
2. **Query**: Find confirmed bookings with check-out date > 6 hours ago
3. **Batch Update**: Update all matching bookings to completed status
4. **Logging**: Log each completion and handle errors individually
5. **Error Handling**: Continue processing other bookings if one fails

## Idempotency

Both manual and automatic completion operations are idempotent:

- Multiple completion attempts on the same order will not cause errors
- Status updates only occur if the order is in the correct state
- No duplicate processing or data corruption

## Notes

- Manual completion requires the current date to be on or after the check-out date
- Automatic completion provides a 6-hour grace period after check-out
- The cron job runs daily at server midnight (00:00)
- Error handling follows the existing pattern in the codebase with CustomError class
- Automatic completion logs each operation for monitoring
- Individual booking update failures in auto-completion don't stop the entire process
- The feature ensures bookings are properly closed after the stay period
