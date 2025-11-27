# Get Reviews by Property ID API Documentation

## Overview

The Get Reviews by Property ID endpoint allows anyone to retrieve public reviews for a specific property. This endpoint provides comprehensive review data including statistics, filtering options, and pagination. Users can view all reviews for a property to make informed booking decisions.

## Authentication

This endpoint is **public** and does not require authentication. Anyone can access reviews for any property.

## Endpoint

### Get Reviews by Property ID

**GET** `/api/review/property/:property_uid`

Retrieve public reviews for a specific property with statistics and filtering options.

#### URL Parameters

- `property_uid` (required): Unique identifier of the property

#### Query Parameters

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `rating` (optional): Filter by rating(s) - single value or comma-separated (e.g., "4,5")
- `sort_by` (optional): Sort field - `created_at`, `rating`, `updated_at` (default: `created_at`)
- `sort_dir` (optional): Sort direction - `asc` or `desc` (default: `desc`)
- `search` (optional): Search in guest names or room types

#### Business Rules

- Only returns public reviews (`is_public = true`) for the specified property
- Reviews are filtered based on the provided parameters
- Statistics are calculated from the filtered review set
- Property must exist and be active

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Reviews retrieved successfully",
  "data": {
    "reviews": [
      {
        "username": "johndoe",
        "roomTypeName": "Deluxe Suite",
        "reviewComment": "Excellent stay! Clean property and great host.",
        "createdAt": "2025-10-06T18:46:54.948Z",
        "rating": 5,
        "tenantName": "Jane Smith",
        "tenantReply": "Thank you for your review! Glad you enjoyed your stay.",
        "updatedAt": "2025-10-06T18:46:54.948Z"
      }
    ],
    "statistics": {
      "totalReviews": 25,
      "averageRating": 4.2,
      "ratingStatistics": [
        { "rating": 1, "count": 2 },
        { "rating": 2, "count": 1 },
        { "rating": 3, "count": 3 },
        { "rating": 4, "count": 8 },
        { "rating": 5, "count": 11 }
      ]
    },
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 3,
      "totalItems": 25
    }
  }
}
```

#### Response Fields

- `reviews`: Array of review objects
  - `username`: Guest's display name or full name
  - `roomTypeName`: Name of the room type booked
  - `reviewComment`: Guest's review text
  - `createdAt`: Review creation timestamp
  - `rating`: Rating value (1-5)
  - `tenantName`: Property owner's display name or full name
  - `tenantReply`: Property owner's reply (null if not replied)
  - `updatedAt`: Review update timestamp

- `statistics`: Review analytics
  - `totalReviews`: Total number of reviews in filtered result
  - `averageRating`: Average rating across all filtered reviews (rounded to 1 decimal)
  - `ratingStatistics`: Array of rating distribution objects
    - `rating`: Star rating (1-5)
    - `count`: Number of reviews with this rating

- `pagination`: Pagination metadata
  - `page`: Current page number
  - `limit`: Items per page
  - `totalPages`: Total number of pages
  - `totalItems`: Total number of reviews

#### Error Responses

- `400 Bad Request`: Invalid pagination, sort parameters, or missing property_uid
- `404 Not Found`: Property not found

#### Notes

- **Public Access**: No authentication required - reviews are publicly visible
- **Statistics Calculation**: Statistics are computed from the filtered review set, not all reviews
- **Search Functionality**: Searches across guest names (first_name, last_name, display_name) and room names
- **Rating Filtering**: Supports single rating or multiple ratings (comma-separated)
- **Sorting Options**: Reviews can be sorted by creation date, rating, or update date

## Filtering Examples

### Filter by Rating

```
GET /api/review/property/PROP-123?rating=4,5
```

Returns only 4-star and 5-star reviews for property PROP-123

### Search Reviews

```
GET /api/review/property/PROP-123?search=john
```

Returns reviews where guest name contains "john" or room name contains "john"

### Sort by Rating

```
GET /api/review/property/PROP-123?sort_by=rating&sort_dir=desc
```

Returns reviews sorted by rating in descending order

### Pagination

```
GET /api/review/property/PROP-123?page=2&limit=5
```

Returns page 2 with 5 reviews per page

## Database Operations

The endpoint performs the following database operations:

1. **Property Lookup**: Validates property exists by UID
2. **Query Building**: Constructs WHERE and ORDER BY clauses based on filters
3. **Review Retrieval**: Fetches public reviews with user, booking, and property relations
4. **Statistics Calculation**: Computes average rating and distribution from filtered results
5. **Pagination**: Applies skip/take for paginated results

## Use Cases

- **Property Research**: Guests can read reviews before booking
- **Property Comparison**: Compare properties based on review data
- **Booking Decision**: Make informed decisions using review statistics
- **Property Marketing**: Property owners can showcase positive reviews
- **Review Aggregation**: Display review summaries on property listing pages

## Performance Considerations

- **Indexing**: The endpoint benefits from indexes on `property_id`, `is_public`, `created_at`, and `rating` columns
- **Pagination**: Large result sets are efficiently paginated to prevent memory issues
- **Filtering**: Database-level filtering reduces memory usage and improves response times
- **Statistics**: Computed efficiently using database aggregation functions

## Integration Notes

This endpoint integrates with:

- **Property Details**: Provides review data for property detail pages
- **Search Results**: Supplies review statistics for property listings
- **Booking Flow**: Allows guests to view reviews during booking process
- **Property Management**: Works with property listing and management features

The endpoint provides comprehensive review access for public consumption while ensuring only appropriate data is exposed.
