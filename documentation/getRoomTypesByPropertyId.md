# Get Room Types by Property ID API

## Endpoint

GET /api/properties/room-types

## Description

Retrieves a list of room types (rooms) for a specific property, returning only the essential information: ID, UID, and name. This endpoint is useful for displaying available room options when viewing property details.

## Query Parameters

- `propertyUid` (required): The unique identifier (UID) of the property to retrieve room types for.

## Response

### Success (200)

```json
{
  "success": true,
  "message": "Room types retrieved successfully",
  "data": {
    "rooms": [
      {
        "id": 1,
        "uid": "ROOM-ABC123",
        "name": "Deluxe Suite"
      },
      {
        "id": 2,
        "uid": "ROOM-DEF456",
        "name": "Standard Room"
      }
    ]
  }
}
```

### Error (400)

Invalid or missing propertyUid parameter.

```json
{
  "success": false,
  "message": "Property UID is required and must be a string"
}
```

### Error (404)

Property not found or not active.

```json
{
  "success": false,
  "message": "Property not found"
}
```

## Business Rules

- Property must exist and have status = 'active'
- Returns rooms ordered by creation date (oldest first)
- No authentication required (public endpoint)
- Only returns id, uid, and name fields for each room

## Database Query

The endpoint performs the following database operations:

1. Validates that propertyUid is provided and is a string
2. Finds property by UID to get the internal property ID
3. Checks if property exists with status = 'active'
4. Queries rooms table where property_id matches the resolved property ID
5. Selects only id, uid, and name fields
6. Orders results by created_at ascending

## Use Cases

- Display room options in property detail pages
- Populate room selection dropdowns
- Show available room types for booking
- Property management interfaces

## Notes

- This is a public endpoint that doesn't require authentication
- Only active properties will return room data
- Rooms are ordered by creation date for consistent display
- The response structure is optimized for frontend consumption
