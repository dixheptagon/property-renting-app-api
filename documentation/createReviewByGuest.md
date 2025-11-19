# Create Review by Guest API Documentation

## Overview

The Create Review by Guest endpoint allows authenticated guest users to submit reviews for their completed bookings. Reviews can only be submitted after the checkout date and for bookings that don't already have a review.

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
  "role": "guest"
}
```

The middleware `@/src/lib/middlewares/verify.token.ts` handles JWT verification and populates `req.user` with the decoded payload.

## Endpoint

### Create Review

**POST** `/api/review/:booking_uid/comment`

Submit a review for a completed booking.

#### Authentication

- Required: JWT token in `Authorization` header (guest user only)

#### Parameters

- `booking_uid` (path): The unique identifier of the booking to review

#### Request Body

```json
{
  "comment": "Amazing experience! The property was clean and the host was very responsive.",
  "rating": 5
}
```

#### Validation Rules

- `comment`: Required, 10-500 characters
- `rating`: Required, integer 1-5

#### Business Rules

- Booking must belong to the authenticated user
- Booking status must be `completed`
- Current date must be after the checkout date
- No existing review for this booking

#### Response (201 Created)

```json
{
  "success": true,
  "message": "Review created successfully",
  "data": {
    "booking_uid": "ORDER-ABC123",
    "status": "completed",
    "review": {
      "id": 1,
      "rating": 5,
      "comment": "Amazing experience! The property was clean and the host was very responsive.",
      "reply": null,
      "createdAt": "2025-10-06T18:46:54.948Z",
      "updatedAt": "2025-10-06T18:46:54.948Z"
    }
  }
}
```

#### Response Fields

- `booking_uid`: Unique booking identifier
- `status`: Booking status (always "completed")
- `review`: Created review object
  - `id`: Review ID
  - `rating`: Rating value (1-5)
  - `comment`: Review text
  - `reply`: Always null for new reviews
  - `createdAt`: Review creation timestamp
  - `updatedAt`: Review update timestamp

#### Error Responses

- `401 Unauthorized`: User not authenticated or user ID not found
- `403 Forbidden`: Booking doesn't belong to user
- `404 Not Found`: Booking not found
- `400 Bad Request`: Invalid data, booking not completed, or current date before checkout
- `409 Conflict`: Review already exists for this booking

#### Notes

- Reviews can only be submitted for bookings with status "completed"
- The current date must be after the booking's checkout date
- Each booking can have only one review
- The review is linked to both the booking and the property for aggregation
- Rating must be an integer between 1 and 5
- Comment must be between 10 and 500 characters

## Database Operations

The endpoint performs the following database operations:

1. Validates JWT token and extracts user UID
2. Finds user by UID to get internal user ID
3. Finds booking by UID with property and existing review data
4. Validates business rules (ownership, status, date, uniqueness)
5. Creates new review record with booking_id, user_id, property_id, rating, and comment
6. Returns created review with related data

## Use Cases

- Allow guests to provide feedback after their stay
- Help property owners improve their services
- Build trust and transparency in the platform
- Generate ratings for property listings
- Provide data for review analytics

## Validation Schema

The request body is validated using Yup schema:

```typescript
{
  comment: string().min(10).max(500).required(),
  rating: number().min(1).max(5).required()
}
```

## Error Handling

All validation and business rule errors are handled with appropriate HTTP status codes and descriptive error messages. Database errors are caught and returned as 500 Internal Server Error.
