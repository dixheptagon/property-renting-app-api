# Get Sales Report API Documentation

## Overview

The Get Sales Report endpoint allows authenticated tenant users to retrieve comprehensive sales analytics for their properties. This endpoint provides total revenue, order statistics, and period-based breakdowns of completed and cancelled orders within a specified date range.

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

### Get Sales Report

**GET** `/api/tenant/sales-report`

Retrieve sales analytics for a tenant's property within a specified date range.

#### Authentication

- Required: JWT token in `Authorization` header (tenant user only)

#### Query Parameters

- `propertyUId` (optional): Property unique identifier (UID). If not provided, uses the tenant's first active property.
- `startDate` (optional): Start date for the report period (YYYY-MM-DD format). If not provided, defaults to 1 month ago.
- `endDate` (optional): End date for the report period (YYYY-MM-DD format). If not provided, defaults to current date.

#### Business Rules

- Only returns data for properties owned by the authenticated tenant
- Date range cannot exceed 6 months (throws error if violated)
- If no propertyUId provided, automatically selects the tenant's first active property (ordered by creation date)
- If no date range provided, defaults to the last 1 month
- Period grouping depends on date range length:
  - 1 month (≤4 weeks): Individual weeks (Week 1-1, Week 2-2, etc.)
  - 2 months (≤8 weeks): Groups of 2 weeks (Week 1-2, Week 3-4, etc.)
  - 3 months (≤12 weeks): Groups of 3 weeks (Week 1-3, Week 4-6, etc.)
  - 6 months (≤26 weeks): Groups of 4 weeks (Week 1-4, Week 5-8, etc.)
- User must have role = `tenant`

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Sales report retrieved successfully",
  "data": {
    "totalRevenue": 2500000,
    "totalOrders": 45,
    "completedOrders": 38,
    "cancelledOrders": 7,
    "periods": [
      {
        "period": "Week 1-1",
        "completed": 8,
        "cancelled": 1
      },
      {
        "period": "Week 2-2",
        "completed": 10,
        "cancelled": 2
      },
      {
        "period": "Week 3-3",
        "completed": 12,
        "cancelled": 3
      },
      {
        "period": "Week 4-4",
        "completed": 8,
        "cancelled": 1
      }
    ],
    "startDate": "2024-10-17",
    "endDate": "2024-11-17"
  }
}
```

#### Response Fields

- `totalRevenue`: Total revenue from completed orders (sum of `total_price` for status = 'completed')
- `totalOrders`: Total number of orders within the date range
- `completedOrders`: Number of orders with status = 'completed'
- `cancelledOrders`: Number of orders with status = 'cancelled'
- `periods`: Array of period objects showing completed and cancelled orders per time period
  - `period`: Period label (e.g., "Week 1-1", "Week 1-2")
  - `completed`: Number of completed orders in this period
  - `cancelled`: Number of cancelled orders in this period
- `startDate`: Report start date (YYYY-MM-DD)
- `endDate`: Report end date (YYYY-MM-DD)

#### Error Responses

- `401 Unauthorized`: User not authenticated or user ID not found
- `403 Forbidden`: User is not a tenant or property does not belong to tenant
- `404 Not Found`: Property not found or no active properties available
- `400 Bad Request`: Invalid date format, date range exceeds 6 months, or startDate >= endDate

#### Notes

- Revenue calculation only includes orders with status = 'completed'
- Period grouping is based on order creation date (`created_at`)
- The endpoint provides both summary statistics and time-series data for charting
- Default date range is exactly 1 month back from current date
- Property selection defaults to the tenant's oldest active property if not specified

## Database Query

The endpoint performs the following database operations:

1. Validates JWT token and extracts user UID
2. Finds user by UID to get internal user ID and verify role = 'tenant'
3. If propertyUId provided:
   - Finds property by UID
   - Verifies property belongs to tenant (user_id match)
4. If no propertyUId:
   - Finds first active property owned by tenant (ordered by created_at)
5. Validates date range (max 6 months)
6. Queries bookings where:
   - `property_id` matches the selected property
   - `created_at` between startDate and endDate
7. Calculates totals and period groupings from booking data

## Use Cases

- Generate sales dashboards for property owners
- Track revenue trends over time
- Monitor order completion vs cancellation rates
- Analyze seasonal booking patterns
- Create financial reports for tax purposes
- Identify peak booking periods

## Period Grouping Logic

The period grouping adapts based on the total date range:

- **Short Range (≤31 days)**: Daily granularity isn't practical, so individual weeks provide good detail
- **Medium Range (32-62 days)**: 2-week periods balance detail with readability
- **Long Range (63-93 days)**: 3-week periods prevent too many data points
- **Extended Range (94-186 days)**: 4-week periods keep the chart manageable

This adaptive grouping ensures the response always provides meaningful insights regardless of the selected date range.

## Response Structure

The response structure is optimized for both summary display and charting:

- Summary metrics at the top level for quick overview
- Period array for time-series visualization
- Date range confirmation for UI display
- Consistent naming conventions with other report endpoints

## Performance Considerations

- Database queries are optimized with proper indexing on `property_id`, `created_at`, and `status`
- Date range validation prevents excessively large queries
- In-memory calculations for totals and period grouping
- No complex joins required beyond basic booking data
