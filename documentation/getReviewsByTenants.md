# Get Reviews by Tenant API Documentation

## Overview

The Get Reviews by Tenant endpoint allows authenticated tenant users to retrieve reviews for their properties. This endpoint provides comprehensive review data including statistics, filtering options, and pagination. Tenants can view all reviews for a specific property or get reviews from their first property if no specific property is specified.

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

The middleware `@/src/lib/middlewares/verify.token.ts` handles JWT verification and populates `req.user` with the decoded payload.

## Endpoint

### Get Reviews by Tenant

**GET** `/api/review/tenant`

Retrieve reviews for tenant's properties with statistics and filtering options.

#### Authentication

- Required: JWT token in `Authorization` header (tenant user only)

#### Query Parameters

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `rating` (optional): Filter by rating(s) - single value or comma-separated (e.g., "4,5")
- `date_from` (optional): Filter reviews from date (ISO format)
- `date_to` (optional): Filter reviews to date (ISO format)
- `sort_by` (optional): Sort field - `created_at`, `rating`, `updated_at` (default: `created_at`)
- `sort_dir` (optional): Sort direction - `asc` or `desc` (default: `desc`)
- `search` (optional): Search in guest names or room types
- `propertyId` (optional): Specific property UID to get reviews for (defaults to first property)

#### Business Rules

- Only returns reviews for properties owned by the authenticated tenant
- If no `propertyId` is specified, uses the tenant's first property
- Reviews are filtered based on the provided parameters
- Statistics are calculated from the filtered review set

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Reviews retrieved successfully",
  "data": {
    "reviews": [
      {
        "id": 1,
        "rating": 5,
        "comment": "Excellent stay! Clean property and great host.",
        "reply": "Thank you for your review! Glad you enjoyed your stay.",
        "created_at": "2025-10-06T18:46:54.948Z",
        "updated_at": "2025-10-06T18:46:54.948Z",
        "user": {
          "first_name": "John",
          "last_name": "Doe",
          "display_name": "johndoe"
        },
        "booking": {
          "uid": "ORDER-ABC123",
          "check_in_date": "2025-10-01T00:00:00.000Z",
          "check_out_date": "2025-10-05T00:00:00.000Z",
          "room": {
            "name": "Deluxe Suite"
          }
        }
      }
    ],
    "statistics": {
      "average_rating": 4.2,
      "total_reviews": 25,
      "rating_distribution": {
        "1": 2,
        "2": 1,
        "3": 3,
        "4": 8,
        "5": 11
      }
    },
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalCount": 25,
      "limit": 20
    }
  }
}
```

#### Response Fields

- `reviews`: Array of review objects
  - `id`: Review ID
  - `rating`: Rating value (1-5)
  - `comment`: Guest's review text
  - `reply`: Tenant's reply (null if not replied)
  - `created_at`: Review creation timestamp
  - `updated_at`: Review update timestamp
  - `user`: Guest information
    - `first_name`: Guest's first name
    - `last_name`: Guest's last name
    - `display_name`: Guest's display name
  - `booking`: Booking details
    - `uid`: Booking unique identifier
    - `check_in_date`: Check-in date
    - `check_out_date`: Check-out date
    - `room`: Room information
      - `name`: Room type name

- `statistics`: Review analytics
  - `average_rating`: Average rating across all filtered reviews (rounded to 1 decimal)
  - `total_reviews`: Total number of reviews in filtered result
  - `rating_distribution`: Count of reviews for each star rating (1-5)

- `pagination`: Pagination metadata
  - `currentPage`: Current page number
  - `totalPages`: Total number of pages
  - `totalCount`: Total number of reviews
  - `limit`: Items per page

#### Error Responses

- `401 Unauthorized`: User not authenticated or user ID not found
- `403 Forbidden`: User is not a tenant or doesn't own the specified property
- `404 Not Found`: Property not found or tenant has no properties
- `400 Bad Request`: Invalid pagination, sort parameters, or date formats

#### Notes

- **Property Selection**: If `propertyId` is not provided, the endpoint automatically selects the tenant's first property
- **Statistics Calculation**: Statistics are computed from the filtered review set, not all reviews
- **Search Functionality**: Searches across guest names (first_name, last_name, display_name) and room names
- **Rating Filtering**: Supports single rating or multiple ratings (comma-separated)
- **Date Filtering**: Uses ISO date format for `date_from` and `date_to` parameters
- **Sorting Options**: Reviews can be sorted by creation date, rating, or update date

## Filtering Examples

### Filter by Rating

```
GET /api/review/tenant?rating=4,5
```

Returns only 4-star and 5-star reviews

### Filter by Date Range

```
GET /api/review/tenant?date_from=2025-01-01&date_to=2025-12-31
```

Returns reviews created within the specified date range

### Search Reviews

```
GET /api/review/tenant?search=john
```

Returns reviews where guest name contains "john" or room name contains "john"

### Specific Property

```
GET /api/review/tenant?propertyId=PROP-123
```

Returns reviews for the specific property

## Database Operations

The endpoint performs the following database operations:

1. **Property Verification**: Validates tenant ownership of the property
2. **Query Building**: Constructs WHERE and ORDER BY clauses based on filters
3. **Review Retrieval**: Fetches reviews with user and booking relations
4. **Statistics Calculation**: Computes average rating and distribution from filtered results
5. **Pagination**: Applies skip/take for paginated results

## Use Cases

- **Review Management**: Tenants can monitor and respond to guest feedback
- **Performance Analytics**: Track property ratings and review trends over time
- **Quality Improvement**: Identify common issues and positive feedback patterns
- **Customer Service**: Respond to reviews and maintain communication with guests
- **Business Intelligence**: Generate insights from review data and statistics

## Performance Considerations

- **Indexing**: The endpoint benefits from indexes on `property_id`, `created_at`, and `rating` columns
- **Pagination**: Large result sets are efficiently paginated to prevent memory issues
- **Filtering**: Database-level filtering reduces memory usage and improves response times
- **Statistics**: Computed efficiently using database aggregation functions

## Integration Notes

This endpoint integrates with:

- **Review Reply Feature**: Provides context for tenants to reply to specific reviews
- **Property Management**: Works with property listing and management features
- **Analytics Dashboard**: Supplies data for tenant dashboard analytics
- **Notification System**: Can trigger notifications for new reviews

The endpoint provides comprehensive review management capabilities for tenants while maintaining security through proper authentication and authorization checks.
