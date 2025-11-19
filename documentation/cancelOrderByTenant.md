# Cancel Order by Tenant

## Overview

This feature allows tenants to cancel orders that are in `pending_payment` status. Tenants can only cancel orders for properties they own and must provide a cancellation reason.

## API Endpoint

```
POST /tenant/:orderId/cancel-order
```

## Request

### URL Parameters

- `orderId` (string, required): The order ID in the format `ORDER-xxxxx`

### Headers

- `Authorization`: Bearer token for tenant authentication
- `Content-Type`: application/json

### Body

```json
{
  "cancellationReason": "string"
}
```

### Validation Rules

- `cancellationReason`: Required string field

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Booking cancelled successfully by tenant.",
  "data": {
    "booking_id": 123,
    "order_uid": "ORDER-ABC123",
    "status": "cancelled",
    "cancellation_reason": "Property no longer available"
  }
}
```

### Error Responses

#### 400 Bad Request

- Invalid order ID format
- Missing or invalid cancellation reason
- Booking status is not `pending_payment`

#### 401 Unauthorized

- Authentication required

#### 403 Forbidden

- User is not a tenant
- Tenant does not own the property

#### 404 Not Found

- Booking not found

## Business Rules

1. **Status Validation**: Only bookings with status `pending_payment` can be cancelled by tenant
2. **Ownership Check**: Tenant must be the owner of the property associated with the booking
3. **Cancellation Reason**: Must be provided and stored in the database
4. **Status Update**: Booking status is updated to `cancelled`

## Implementation Details

- **Controller**: `CancelOrderByTenantController` in `src/routers/tenant-transactions/cancel-order/cancel.order.controller.ts`
- **Validation**: `CancelOrderByTenantSchema` in `src/routers/tenant-transactions/cancel-order/cancel.order.validation.ts`
- **Route**: `POST /tenant/:orderId/cancel-order` in tenant router

## Database Changes

The booking record is updated with:

- `status`: Changed to `'cancelled'`
- `cancellation_reason`: Set to the provided reason

## Error Handling

- All errors are handled through the global error handler
- Custom errors provide specific messages for different failure scenarios
- Validation errors are returned with detailed field-level information

## Security Considerations

- Authentication required via middleware
- Role-based access control (tenant only)
- Authorization check ensures tenant owns the property
- Input validation prevents malicious data

## Testing

Unit tests should cover:

- Successful cancellation
- Invalid order ID format
- Missing cancellation reason
- Unauthorized access
- Forbidden access (wrong tenant)
- Booking not found
- Invalid booking status
