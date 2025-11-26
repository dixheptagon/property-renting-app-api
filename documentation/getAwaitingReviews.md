# Get Awaiting Reviews API Documentation

## Overview

The Get Awaiting Reviews endpoint allows authenticated guest users to retrieve a list of their completed bookings that do not yet have reviews submitted. This helps guests identify which bookings they can still review after their stay.

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

### Get Awaiting Reviews

**GET** `/api/review/awaiting-reviews`

Retrieve all completed bookings without reviews for the authenticated guest user.

#### Authentication

- Required: JWT token in `Authorization` header (guest user only)

#### Query Parameters

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `orderBy` (optional): Sort field - `createdAt` or `check_in_date` (default: `createdAt`)
- `order` (optional): Sort order - `asc` or `desc` (default: `desc`)

#### Business Rules

- Only returns bookings belonging to the authenticated user
- Only includes bookings with status = `completed`
- Only includes bookings that do not have an associated review
- User must have role = `guest`

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Awaiting reviews retrieved successfully",
  "data": {
    "awaiting_reviews": [
      {
        "booking_uid": "ORDER-ABC123",
        "status": "completed",
        "check_in_date": "2025-10-01T00:00:00.000Z",
        "check_out_date": "2025-10-05T00:00:00.000Z",
        "total_price": 1500000,
        "property": {
          "id": 789,
          "name": "Beautiful Beach Villa",
          "room_types": ["Deluxe Room", "Standard Room"]
        }
      },
      {
        "booking_uid": "ORDER-DEF456",
        "status": "completed",
        "check_in_date": "2025-10-10T00:00:00.000Z",
        "check_out_date": "2025-10-15T00:00:00.000Z",
        "total_price": 2000000,
        "property": {
          "id": 790,
          "name": "City Center Apartment",
          "room_types": ["Master Suite"]
        }
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

#### Response Fields

- `awaiting_reviews`: Array of booking objects awaiting review
  - `booking_uid`: Unique booking identifier
  - `status`: Booking status (always "completed")
  - `check_in_date`: Check-in date
  - `check_out_date`: Check-out date
  - `total_price`: Total booking price
  - `property`: Property information
    - `id`: Property ID
    - `name`: Property title
    - `room_types`: Array of room names in the property

- `pagination`: Pagination metadata
  - `currentPage`: Current page number
  - `totalPages`: Total number of pages
  - `totalCount`: Total number of awaiting reviews
  - `limit`: Items per page

#### Error Responses

- `401 Unauthorized`: User not authenticated or user ID not found
- `403 Forbidden`: User is not a guest
- `400 Bad Request`: Invalid pagination or order parameters

#### Notes

- This endpoint is specifically for guests to see which of their completed bookings still need reviews
- The response includes property details and room types to help guests identify their bookings
- Bookings are sorted by creation date or check-in date as specified
- Pagination is implemented to handle large numbers of bookings efficiently
- Only bookings with status "completed" and no existing review are returned

## Database Query

The endpoint performs the following database operations:

1. Finds the user by UID to get the internal user ID
2. Queries bookings where:
   - `user_id` matches the authenticated user
   - `status` equals "completed"
   - `review` is null (no review exists)
3. Includes property information with room details
4. Applies sorting and pagination
5. Counts total records for pagination metadata

## Use Cases

- Display a "Write Review" section in guest dashboards
- Show pending review notifications
- Allow guests to track which bookings they've reviewed
- Provide quick access to review submission for completed stays
