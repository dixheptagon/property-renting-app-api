# Reply Review by Tenant API Documentation

## Overview

The Reply Review by Tenant endpoint allows authenticated tenant users to reply to reviews left by guests for their properties. This endpoint enables property owners to engage with guest feedback by providing responses to reviews, enhancing communication and potentially improving their service quality.

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

### Reply to Review

**POST** `/api/review/:booking_uid/reply`

Reply to a review for a specific booking. The booking UID is passed as a URL parameter.

#### Authentication

- Required: JWT token in `Authorization` header (tenant user only)

#### URL Parameters

- `booking_uid` (required): The unique identifier (UID) of the booking that contains the review to reply to.

#### Request Body

```json
{
  "booking_uid": "ORDER-ABC123",
  "reply_comment": "Thank you for your feedback! We appreciate your stay and will work on improving our cleanliness standards."
}
```

### Request Body Parameters

- `booking_uid` (required): The unique identifier of the booking (must match the URL parameter)
- `reply_comment` (required): The reply text from the tenant
  - Minimum length: 10 characters
  - Maximum length: 1000 characters

#### Business Rules

- Only tenants can reply to reviews
- The booking must exist and have an associated review
- The tenant must own the property associated with the booking
- The booking UID in the request body must match the URL parameter
- User must have role = `tenant`

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Reply added to review successfully",
  "data": {
    "id": 1,
    "booking_id": 123,
    "user_id": 456,
    "property_id": 789,
    "rating": 4,
    "comment": "Great location and friendly staff, but room could be cleaner.",
    "reply": "Thank you for your feedback! We appreciate your stay and will work on improving our cleanliness standards.",
    "is_public": true,
    "created_at": "2025-10-15T10:30:00.000Z",
    "updated_at": "2025-10-16T14:20:00.000Z",
    "user": {
      "first_name": "John",
      "last_name": "Doe",
      "display_name": "johndoe"
    },
    "booking": {
      "uid": "ORDER-ABC123"
    },
    "property": {
      "title": "Beautiful Beach Villa"
    }
  }
}
```

#### Response Fields

- `id`: Review ID
- `booking_id`: Internal booking ID
- `user_id`: Guest user ID
- `property_id`: Property ID
- `rating`: Rating value (1-5)
- `comment`: Original guest review text
- `reply`: Tenant reply text (newly added)
- `is_public`: Whether the review is publicly visible
- `created_at`: Review creation timestamp
- `updated_at`: Review update timestamp (updated when reply is added)
- `user`: Guest information
  - `first_name`: Guest's first name
  - `last_name`: Guest's last name
  - `display_name`: Guest's display name
- `booking`: Booking information
  - `uid`: Booking unique identifier
- `property`: Property information
  - `title`: Property title

#### Error Responses

- `400 Bad Request`: Invalid request body or validation errors

  ```json
  {
    "success": false,
    "message": "Reply comment must be at least 10 characters"
  }
  ```

- `401 Unauthorized`: User not authenticated

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
    "message": "You can only reply to reviews for properties you own"
  }
  ```

- `404 Not Found`: Booking or review not found
  ```json
  {
    "success": false,
    "message": "Review not found for this booking"
  }
  ```

#### Notes

- This endpoint updates the existing review record with the reply
- The `updated_at` timestamp is automatically updated when the reply is added
- Tenants can only reply to reviews for properties they own
- The booking must have a completed status and an associated review
- Reply comments are stored as plain text and can be updated by subsequent calls to this endpoint

## Database Query

The endpoint performs the following database operations:

1. Validates JWT token and extracts user UID
2. Finds user by UID to get internal user ID
3. Finds booking by UID with property and review relations
4. Validates that review exists for the booking
5. Verifies tenant ownership of the property
6. Updates the review record with the reply comment
7. Returns the updated review with related user, booking, and property data

## Use Cases

- Respond to guest feedback to show engagement
- Address specific concerns raised in reviews
- Provide additional context or explanations
- Build better relationships with guests
- Improve property reputation through responsive communication
- Gather insights for property improvements

## Validation Rules

- **booking_uid**: Required string, must match URL parameter
- **reply_comment**: Required string, 10-1000 characters
- **Authentication**: Valid JWT token required
- **Authorization**: User must be a tenant
- **Ownership**: Tenant must own the property associated with the booking
- **Review Existence**: Booking must have an associated review

## Response Structure

The response includes the complete updated review object with all related data, allowing the frontend to immediately display the reply and update the UI without additional API calls.

## Security Considerations

- JWT token validation ensures only authenticated users can reply
- Role-based access control ensures only tenants can reply to reviews
- Property ownership validation prevents tenants from replying to reviews for properties they don't own
- Input validation prevents malicious or malformed data
