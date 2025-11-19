# Get My Reviews API Documentation

## Overview

The Get My Reviews endpoint allows authenticated guest users to retrieve a list of their submitted reviews for completed bookings. This endpoint returns only bookings that have associated reviews, providing guests with a history of their feedback.

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

### Get My Reviews

**GET** `/api/review/my-reviews`

Retrieve all reviews submitted by the authenticated guest user.

#### Authentication

- Required: JWT token in `Authorization` header (guest user only)

#### Query Parameters

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `orderBy` (optional): Sort field - `reviewCreatedAt` (default: `reviewCreatedAt`)
- `order` (optional): Sort order - `asc` or `desc` (default: `desc`)

#### Business Rules

- Only returns bookings belonging to the authenticated user
- Only includes bookings with status = `completed`
- Only includes bookings that have an associated review
- User must have role = `guest`

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
          "name": "Beautiful Beach Villa",
          "room_type": "Deluxe Suite",
          "tenant": {
            "id": 456,
            "first_name": "John",
            "last_name": "Doe",
            "display_name": "johndoe"
          }
        },
        "review": {
          "id": 1,
          "rating": 5,
          "comment": "Amazing experience! Clean property and great host.",
          "reply": "Thank you for your review! Glad you enjoyed your stay.",
          "createdAt": "2025-10-06T18:46:54.948Z",
          "updatedAt": "2025-10-06T18:46:54.948Z"
        }
      },
      {
        "booking_uid": "ORDER-DEF456",
        "status": "completed",
        "property": {
          "id": 790,
          "name": "City Center Apartment",
          "room_type": "Master Bedroom",
          "tenant": {
            "id": 457,
            "first_name": "Jane",
            "last_name": "Smith",
            "display_name": "janesmith"
          }
        },
        "review": {
          "id": 2,
          "rating": 4,
          "comment": "Good location, but could be cleaner.",
          "reply": null,
          "createdAt": "2025-10-08T10:30:00.000Z",
          "updatedAt": "2025-10-08T10:30:00.000Z"
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

- `reviews`: Array of review objects
  - `booking_uid`: Unique booking identifier
  - `status`: Booking status (always "completed")
  - `property`: Property information
    - `id`: Property ID
    - `name`: Property title
    - `room_type`: Name of the booked room
    - `tenant`: Host information
      - `id`: Tenant ID
      - `first_name`: Tenant's first name
      - `last_name`: Tenant's last name
      - `display_name`: Tenant's display name
  - `review`: Review details
    - `id`: Review ID
    - `rating`: Rating value (1-5)
    - `comment`: Review text
    - `reply`: Optional tenant reply (null if not replied)
    - `createdAt`: Review creation timestamp
    - `updatedAt`: Review update timestamp

- `pagination`: Pagination metadata
  - `currentPage`: Current page number
  - `totalPages`: Total number of pages
  - `totalCount`: Total number of reviews
  - `limit`: Items per page

#### Error Responses

- `401 Unauthorized`: User not authenticated or user ID not found
- `403 Forbidden`: User is not a guest
- `400 Bad Request`: Invalid pagination or order parameters

#### Notes

- This endpoint only returns reviews that have been submitted (bookings with associated reviews)
- Reviews are ordered by their creation date (when the review was submitted)
- The response includes detailed property and tenant information for context
- Tenant replies are included when available
- Pagination is implemented to handle large numbers of reviews efficiently

## Database Query

The endpoint performs the following database operations:

1. Validates JWT token and extracts user UID
2. Finds user by UID to get internal user ID
3. Queries bookings where:
   - `user_id` matches the authenticated user
   - `status` equals "completed"
   - `review` is not null (ensuring review exists)
4. Includes property, room, and tenant details
5. Orders results by `review.created_at`
6. Applies pagination
7. Counts total records for pagination metadata

## Use Cases

- Display review history in guest profiles
- Allow guests to track their submitted feedback
- Show review statistics and ratings given
- Provide access to tenant replies
- Enable review management features

## Sorting

Reviews are sorted by the `created_at` timestamp of the review record, allowing guests to see their most recent reviews first (default descending order) or oldest first (ascending order).

## Response Structure

The response maintains consistency with other review endpoints while providing comprehensive information about each reviewed booking, including property details and tenant information for better user experience.
