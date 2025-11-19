# Get Property Report API

## Endpoint

GET /api/tenant/property-report

## Description

Retrieves occupancy and availability metrics for a specific property on a selected date. This endpoint provides real-time unit availability information including booked units, available units, total units, and occupancy rate calculations.

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

## Query Parameters

- `property_uid` (required): The unique identifier (UID) of the property to get report for.
- `room_type_uid` (optional): The unique identifier (UID) of a specific room type to filter the report. If not provided, includes all room types for the property.
- `selected_date` (required): The date to check occupancy for (YYYY-MM-DD format).

## Response

### Success (200)

```json
{
  "success": true,
  "message": "Property report retrieved successfully",
  "data": {
    "booked_units": 8,
    "available_units": 12,
    "total_units": 20,
    "occupancy_rate": 40,
    "selected_date": "2024-11-17"
  }
}
```

### Error (400)

Invalid or missing parameters.

```json
{
  "success": false,
  "message": "Property UID is required and must be a string"
}
```

### Error (403)

User is not authorized to access this property.

```json
{
  "success": false,
  "message": "Property does not belong to this tenant"
}
```

### Error (404)

Property or room type not found.

```json
{
  "success": false,
  "message": "Property not found"
}
```

## Business Rules

- Only tenants can access property reports
- Property must exist and have status = 'active'
- Property must belong to the authenticated tenant
- If room_type_uid is provided, it must exist and belong to the specified property
- Selected date must be a valid date in YYYY-MM-DD format
- Booked rooms count includes only active bookings (pending_payment, processing, confirmed, completed)
- Occupancy rate is calculated as (booked_rooms / total_rooms) \* 100, rounded to nearest integer

## Response Fields

- `booked_units`: Number of units that are booked on the selected date
- `available_units`: Number of units that are available (total_units - booked_units)
- `total_units`: Total number of units matching the criteria
- `occupancy_rate`: Percentage of occupied units (0-100)
- `selected_date`: The date the report was generated for (YYYY-MM-DD)

## Database Query Logic

The endpoint performs the following operations:

1. Validates JWT token and extracts user information
2. Verifies user has tenant role
3. Finds property by UID and verifies ownership
4. If room_type_uid provided, validates it exists and belongs to property
5. Sums total_units from all matching room types
6. Counts booked units by finding bookings where:
   - check_in_date <= selected_date < check_out_date
   - booking status is active (not cancelled)
   - room matches the filter criteria
7. Calculates available units and occupancy rate

## Booking Overlap Logic

A room is considered "booked" on the selected date if there exists a booking where:

- `check_in_date` <= `selected_date`
- `check_out_date` > `selected_date`

This means the guest is scheduled to stay on that date.

## Use Cases

- Real-time availability checking for property management
- Occupancy rate monitoring for revenue optimization
- Booking system integration for availability display
- Property performance analytics
- Capacity planning and forecasting

## Notes

- The endpoint provides snapshot data for a specific date
- Bookings with status 'cancelled' are not counted as booked
- If no units match the criteria, all values return 0
- Occupancy rate is rounded to the nearest whole number
- The selected_date is returned in the response for confirmation
