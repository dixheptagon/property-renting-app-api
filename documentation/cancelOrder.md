# Cancel Order Feature Implementation

## Overview

This document contains the implementation of the Cancel Order feature for the property renting app API. The feature allows users to cancel bookings that are in `pending_payment` status and includes an auto-cancel mechanism for bookings that remain unpaid after 2 hours.

## Requirements

- Endpoint: `POST /booking/:orderId/cancel-order`
- Only cancel bookings with status `pending_payment`
- Validate order ownership
- Auto-cancel after 2 hours if still `pending_payment`

## Dependencies

Install the required package:

```bash
npm install node-cron
npm install --save-dev @types/node-cron
```

## Express Route Handler Implementation

### File: `src/routers/booking/cancel-order/cancel.order.controller.ts`

## Prisma Query for Updating Order Status

The Prisma query used in the controller:

```typescript
const updatedBooking = await database.booking.update({
  where: { id: booking.id },
  data: { status: 'cancelled' },
});
```

For the auto-cancel cron job:

```typescript
const result = await database.booking.updateMany({
  where: {
    status: 'pending_payment',
    payment_deadline: {
      lt: now,
    },
  },
  data: {
    status: 'cancelled',
  },
});
```

## Auto-Cancel Cron Job Implementation

### File: `src/routers/booking/auto-cancel-order/auto.cancel.order.controller.ts`

### Initialization in `src/app.ts`

```typescript
// Initialize auto-cancel cron job
import { AutoCancelOrder } from './routers/booking/auto-cancel-order/auto.cancel.order.controller';
AutoCancelOrder();
```

## HTTP Response Examples

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "id": 123,
    "uid": "ORDER-ABC123",
    "status": "cancelled"
  }
}
```

### Error Responses

#### 400 Bad Request (Invalid status)

```json
{
  "success": false,
  "message": "Cancellation not allowed. Booking must be in pending_payment status.",
  "data": null
}
```

#### 403 Forbidden (Not owner)

```json
{
  "success": false,
  "message": "Access denied",
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

The route is already configured in `src/routers/booking/booking.route.ts`:

```typescript
// 4. Cancel Booking Order
bookingRouter.post('/booking/:orderId/cancel-order', CancelOrderController);
```

## Business Logic Summary

1. **Validation**: Check if user is authenticated and order exists
2. **Authorization**: Ensure user owns the booking
3. **Status Check**: Only allow cancellation if status is `pending_payment`
4. **Update**: Change status to `cancelled`
5. **Auto-Cancel**: Cron job runs hourly to cancel expired pending payments

## Notes

- The `payment_deadline` is set to 2 hours after booking creation in the create-order controller
- The cron job uses `updateMany` for efficient bulk updates
- Error handling follows the existing pattern in the codebase
- Logging is included for monitoring auto-cancel operations
