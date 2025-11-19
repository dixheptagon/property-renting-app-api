# Review Feature API Documentation

## Overview

The Review Feature allows guests to submit reviews for completed bookings and tenants to reply to those reviews. Reviews can only be submitted after the checkout date and for completed bookings.

## Authentication

All review endpoints require authentication via the `x-user` header containing a JSON object with user information:

```json
{
  "id": 123,
  "email": "user@example.com",
  "role": "guest"
}
```

The middleware `@/src/lib/middlewares/dummy.verify.role.ts` handles authentication and populates `req.user` with this information.

## Review Rules

- A user can only submit a review if:
  - The booking status = `completed`
  - Current date is after the check-out date
  - No existing review has been submitted for the same booking
- A tenant can reply to a review that has been submitted by a user
- Each review can only have one reply

## Endpoints

### 1. Create Review

**POST** `/api/review/:booking_uid/comment`

Submit a review for a completed booking.

#### Authentication

- Required: `x-user` header with user object (guest user only)

#### Parameters

- `booking_uid` (path): The unique identifier of the booking

#### Request Body

```json
{
  "comment": "Great experience, clean property and friendly host!",
  "rating": 5
}
```

#### Validation Rules

- `comment`: Required, 10-1000 characters
- `rating`: Required, integer 1-5

#### Business Rules

- Booking must belong to the authenticated user
- Booking status must be `completed`
- Current date must be after checkout date
- No existing review for this booking

#### Response (201 Created)

```json
{
  "success": true,
  "message": "Review created successfully",
  "data": {
    "id": 1,
    "booking_id": 123,
    "user_id": 456,
    "property_id": 789,
    "rating": 5,
    "comment": "Great experience, clean property and friendly host!",
    "reply": null,
    "is_public": true,
    "created_at": "2025-10-06T18:46:54.948Z",
    "updated_at": null,
    "deleted_at": null,
    "user": {
      "first_name": "John",
      "last_name": "Doe",
      "display_name": "johndoe"
    },
    "booking": {
      "uid": "ORDER-ABC123",
      "check_in_date": "2025-10-01T00:00:00.000Z",
      "check_out_date": "2025-10-05T00:00:00.000Z"
    }
  }
}
```

#### Error Responses

- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: Booking doesn't belong to user
- `400 Bad Request`: Invalid data or business rule violation
- `404 Not Found`: Booking not found
- `409 Conflict`: Review already exists

---

### 2. Get Reviews by Property

**GET** `/api/review/:propertyId`

Retrieve all reviews for a specific property (used for tenant dashboard).

#### Parameters

- `propertyId` (path): The property ID

#### Query Parameters

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `orderBy` (optional): Sort field - `createdAt` or `rating` (default: `createdAt`)
- `order` (optional): Sort order - `asc` or `desc` (default: `desc`)

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Reviews retrieved successfully",
  "data": {
    "reviews": [
      {
        "id": 1,
        "booking_id": 123,
        "user_id": 456,
        "property_id": 789,
        "rating": 5,
        "comment": "Excellent stay!",
        "reply": "Thank you for your review!",
        "is_public": true,
        "created_at": "2025-10-06T18:46:54.948Z",
        "updated_at": null,
        "deleted_at": null,
        "user": {
          "first_name": "John",
          "last_name": "Doe",
          "display_name": "johndoe"
        },
        "booking": {
          "uid": "ORDER-ABC123",
          "check_in_date": "2025-10-01T00:00:00.000Z",
          "check_out_date": "2025-10-05T00:00:00.000Z"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalCount": 1,
      "limit": 10
    }
  }
}
```

#### Error Responses

- `400 Bad Request`: Invalid property ID or pagination parameters
- `404 Not Found`: Property not found

---

### 3. Get My Reviews

**GET** `/api/review/my-reviews`

Retrieve all reviews belonging to the authenticated guest user.

#### Authentication

- Required: `x-user` header with user object (guest user only)

#### Query Parameters

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `orderBy` (optional): Sort field - `createdAt` or `check_in_date` (default: `createdAt`)
- `order` (optional): Sort order - `asc` or `desc` (default: `desc`)

#### Response (200 OK)

```json
{
  "success": true,
  "message": "My reviews retrieved successfully",
  "data": {
    "reviews": [
      {
        "booking_uid": "ORDER-ABC123",
        "status": "completed",
        "property": {
          "id": 789,
          "name": "Beautiful Beach Villa"
        },
        "review": {
          "id": 1,
          "rating": 5,
          "comment": "Amazing place!",
          "reply": "Glad you enjoyed your stay!",
          "createdAt": "2025-10-06T18:46:54.948Z"
        }
      },
      {
        "booking_uid": "ORDER-DEF456",
        "status": "completed",
        "property": {
          "id": 790,
          "name": "City Center Apartment"
        },
        "review": null
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalCount": 2,
      "limit": 10
    }
  }
}
```

#### Notes

- Only shows bookings with status = `completed`
- If booking has no review, `review` field is `null`

#### Error Responses

- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: User is not a guest
- `400 Bad Request`: Invalid pagination parameters

---

### 4. Tenant Reply to Review

**POST** `/api/review/:booking_uid/reply`

Allow tenants to reply to reviews for their properties.

#### Authentication

- Required: `x-user` header with user object (tenant user only)

#### Parameters

- `booking_uid` (path): The unique identifier of the booking

#### Request Body

```json
{
  "reply_comment": "Thank you for your feedback. We're glad you enjoyed your stay!"
}
```

#### Validation Rules

- `reply_comment`: Required, 10-1000 characters

#### Business Rules

- Tenant must own the property linked to the review
- Review must exist
- No previous reply for this review

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
    "rating": 5,
    "comment": "Great experience!",
    "reply": "Thank you for your feedback. We're glad you enjoyed your stay!",
    "is_public": true,
    "created_at": "2025-10-06T18:46:54.948Z",
    "updated_at": "2025-10-06T18:46:54.948Z",
    "deleted_at": null,
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

#### Error Responses

- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: User is not a tenant or doesn't own the property
- `404 Not Found`: Booking or review not found
- `409 Conflict`: Reply already exists

## Error Handling

All endpoints implement graceful error handling with appropriate HTTP status codes and descriptive error messages.

## Logging and Audit Trail

- Review creation is logged with booking UID and user ID
- Reply creation is logged with review ID, booking UID, and tenant ID
- All logs include timestamps for transparency

## Database Schema

The Review model includes:

- `booking_id` (unique): Links to Booking table
- `user_id`: Guest who created the review
- `property_id`: Property being reviewed
- `rating`: Decimal rating (1-5)
- `comment`: Review text
- `reply`: Optional tenant reply
- `is_public`: Boolean flag for review visibility
- Timestamps: `created_at`, `updated_at`, `deleted_at`
