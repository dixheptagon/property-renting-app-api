# Complete & Auto Complete Order Feature

## Overview

This feature allows tenants to manually complete orders and automatically completes orders that have passed their check-out date by 6 hours.

## Manual Completion

### Endpoint

```
POST /api/tenant/{orderId}/complete-order
```

### Requirements

- **Authentication**: Required (Tenant role only)
- **Authorization**: Only the tenant who owns the property can complete the order
- **Order Status**: Must be `confirmed`
- **Date Validation**: Current date must be on or after the check-out date

### Request

- **Method**: POST
- **URL Parameters**:
  - `orderId`: Order UID (format: ORDER-xxxxx)
- **Headers**:
  - `Authorization`: Bearer token
  - `Content-Type`: application/json

### Response

#### Success (200)

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

#### Error Responses

- **400 Bad Request**: Invalid order ID format, wrong status, or date validation failed
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Not a tenant or doesn't own the property
- **404 Not Found**: Order not found

## Automatic Completion

### Description

The system automatically marks orders as completed when:

- Order status is `confirmed`
- Check-out date has passed by 6 hours or more

### Schedule

- **Frequency**: Daily at midnight (00:00 server time)
- **Implementation**: Cron job using `node-cron`

### Process

1. Query all bookings with `status = 'confirmed'` and `check_out_date < (current_time - 6 hours)`
2. Update matching bookings to `status = 'completed'`
3. Log completion details for each order
4. Handle errors gracefully without stopping the process

### Logging

- Console logs for job start/completion
- Individual order completion logs
- Error logs for failed completions

## Idempotency

Both manual and automatic completion operations are idempotent:

- Multiple completion attempts on the same order will not cause errors
- Status updates only occur if the order is in the correct state
- No duplicate processing or data corruption

## Files Modified/Created

### Controllers

- `src/routers/tenant-transactions/complete-order/complete.order.controller.ts` - Manual completion endpoint
- `src/routers/tenant-transactions/auto-complete-order/auto.complete.order.controller.ts` - Auto completion cron job

### Routes

- `src/routers/tenant-transactions/tenant.route.ts` - Added complete order route

### App Initialization

- `src/app.ts` - Initialize auto complete cron job

## Database Schema

Uses existing `Booking` model with `BookingStatus` enum:

- `pending_payment`
- `processing`
- `confirmed`
- `cancelled`
- `completed`

## Error Handling

- Comprehensive validation in manual endpoint
- Try-catch blocks with proper error logging
- Graceful failure handling in auto completion (continues processing other orders)
- Custom error responses with descriptive messages

## Security

- Role-based access control (tenant only)
- Property ownership verification
- Input validation and sanitization
- Authentication middleware enforcement

## Testing Considerations

- Test manual completion with various scenarios (wrong status, wrong dates, unauthorized access)
- Test auto completion timing (ensure 6-hour delay is respected)
- Verify idempotency (multiple calls don't break system)
- Check logging output for debugging
- Test cron job scheduling and execution
