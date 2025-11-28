# Get Booking by Tenant API Documentation

## Overview

The Get Booking by Tenant endpoint allows authenticated tenant users to retrieve detailed information about a specific booking for properties they own. This endpoint is used by tenants to view booking details, including guest information, property details, and booking status.

## Authentication

This endpoint requires authentication via a JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

The JWT payload should contain:

```json
{
  "uid": "user-uuid",
  "email": "user@example.com",
  "role": "tenant"
}
```

The middleware `@/src/lib/middlewares/verify.token.ts` and `@/src/lib/middlewares/verify.role.ts` handle JWT verification and role validation, populating `req.user` with the decoded payload.

## Endpoint

### Get Booking by Tenant

**GET** `/tenant/:orderId/get-booking`

Retrieve detailed booking information for a specific booking on the authenticated tenant's properties.

#### Authentication

- Required: JWT token in `Authorization` header (tenant user only)

#### URL Parameters

- `orderId` (required): The unique identifier of the booking (string, format: ORDER-xxxxx)

#### Business Rules

- Only tenants can access this endpoint
- The booking must exist and belong to a property owned by the authenticated tenant
- User must have role = `tenant`

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Booking retrieved successfully",
  "data": {
    "id": 123,
    "uid": "ORDER-ABC123",
    "status": "confirmed",
    "check_in_date": "2025-10-01T00:00:00.000Z",
    "check_out_date": "2025-10-05T00:00:00.000Z",
    "total_price": 500000,
    "fullname": "John Doe",
    "email": "john.doe@example.com",
    "phone_number": "+628123456789",
    "payment_method": "Bank Transfer",
    "payment_proof": "https://cloudinary.com/payment_proof.jpg",
    "cancellation_reason": null,
    "transaction_id": "TRX-123456",
    "payment_deadline": "2025-09-15T10:00:00.000Z",
    "paid_at": "2025-09-15T09:30:00.000Z",
    "room": {
      "id": 456,
      "name": "Deluxe Suite",
      "property": {
        "id": 789,
        "tenant_email": "tenant@example.com",
        "title": "Luxury Beach Resort",
        "address": "Jl. Pantai No. 123",
        "city": "Bali",
        "main_image": "https://cloudinary.com/main_image.jpg"
      }
    }
  }
}
```

#### Response Fields

- `id`: Booking internal ID
- `uid`: Booking unique identifier (ORDER-xxxxx format)
- `status`: Booking status (pending_payment, processing, confirmed, cancelled, completed)
- `check_in_date`: Check-in date and time
- `check_out_date`: Check-out date and time
- `total_price`: Total booking price
- `fullname`: Guest's full name
- `email`: Guest's email address
- `phone_number`: Guest's phone number
- `payment_method`: Payment method used
- `payment_proof`: URL to payment proof image (if uploaded)
- `cancellation_reason`: Reason for cancellation (if applicable)
- `transaction_id`: Payment gateway transaction ID
- `payment_deadline`: Deadline for payment
- `paid_at`: Payment completion timestamp
- `room`: Room details
  - `id`: Room internal ID
  - `name`: Room name
  - `property`: Property information
    - `id`: Property internal ID
    - `tenant_email`: Property owner's email
    - `title`: Property title
    - `address`: Property address
    - `city`: Property city
    - `main_image`: URL to property's main image

#### Error Responses

- `401 Unauthorized`: User not authenticated or user ID not found

  ```json
  {
    "success": false,
    "message": "User not authenticated"
  }
  ```

- `403 Forbidden`: User is not a tenant or doesn't own the property

  ```json
  {
    "success": false,
    "message": "Access denied"
  }
  ```

- `404 Not Found`: Booking not found

  ```json
  {
    "success": false,
    "message": "Booking not found"
  }
  ```

#### Notes

- This endpoint returns comprehensive booking details for tenant management
- The booking must belong to a property owned by the authenticated tenant
- Guest information is included for tenant reference
- Property details help tenants identify which property the booking is for
- The response structure is similar to the guest booking retrieval but includes tenant-specific information

## Database Query

The endpoint performs the following database operations:

1. Validates JWT token and extracts user UID
2. Finds user by UID to get internal user ID and verify role = 'tenant'
3. Finds booking by UID with property, room, and tenant relations
4. Verifies that the booking's property belongs to the authenticated tenant
5. Returns the booking with all related data

## Use Cases

- View booking details for tenant dashboard
- Access guest information for check-in procedures
- Monitor booking status and payment information
- Manage bookings across multiple properties
- Prepare for guest arrival with booking details

## Security Considerations

- JWT token validation ensures only authenticated users can access
- Role-based access control ensures only tenants can view booking details
- Property ownership validation prevents tenants from viewing bookings for properties they don't own
- Sensitive guest information is only accessible to the property owner

## Integration Notes

This endpoint integrates with:

- **Tenant Dashboard**: Provides booking details for management interface
- **Booking Management**: Works with confirm/reject/cancel booking endpoints
- **Property Management**: Links to property details and room information
- **Payment Processing**: Shows payment status and proof information

The endpoint provides essential booking information for tenant operations while maintaining proper access controls and data privacy.
