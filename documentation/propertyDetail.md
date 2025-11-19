# Property Details API Documentation

## Endpoint

**GET** `/api/properties/:uid/property-details`

## Description

Retrieves detailed information about a specific property, including its rooms, images, and tenant information.

## Parameters

### Path Parameters

| Parameter | Type   | Required | Description                       |
| --------- | ------ | -------- | --------------------------------- |
| `uid`     | string | Yes      | Unique identifier of the property |

## Request Examples

### Basic Request

```
GET /api/properties/abc123/property-details
```

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Property details retrieved successfully",
  "data": {
    "uid": "abc123",
    "category": "apartment",
    "title": "Luxury Downtown Apartment",
    "description": "A beautiful apartment in the city center...",
    "address": "123 Main St",
    "city": "New York",
    "country": "USA",
    "postal_code": "10001",
    "latitude": 40.7128,
    "longitude": -74.006,
    "place_id": "ChIJd8BlQ2BZwokRAFUEcm_qrcA",
    "map_url": "https://maps.google.com/...",
    "amenities": ["wifi", "parking", "pool"],
    "custom_amenities": null,
    "rules": ["no smoking", "no pets"],
    "custom_rules": null,
    "rating_avg": 4.5,
    "rating_count": 25,
    "base_price": 150.0,
    "status": "active",
    "tenant": {
      "id": 1,
      "name": "John Doe",
      "profile_picture_url": "https://example.com/avatar.jpg"
    },
    "images": [
      {
        "url": "https://example.com/image1.jpg",
        "is_main": true,
        "order_index": 0
      }
    ],
    "rooms": [
      {
        "uid": "room456",
        "name": "Master Bedroom",
        "description": "Spacious master bedroom with city view",
        "base_price": 150.0,
        "max_guest": 2,
        "bedrooms": 1,
        "bathrooms": 1,
        "beds": 1,
        "highlight": ["city view", "king bed"],
        "custom_highlight": null,
        "total_units": 1,
        "images": [
          {
            "url": "https://example.com/room1.jpg",
            "is_main": true,
            "order_index": 0
          }
        ],
        "base_price": 150.0
      }
    ]
  },
  "room_unavailabilities": [
    {
      "id": 1,
      "room_id": 1,
      "start_date": "2024-12-20",
      "end_date": "2024-12-25",
      "reason": "Maintenance"
    }
  ],
  "peak_season_rates": [
    {
      "id": 1,
      "room_id": 1,
      "start_date": "2024-12-20",
      "end_date": "2024-12-31",
      "adjustment_type": "percentage",
      "adjustment_value": 10.0
    }
  ]
      }
    ]
  }
}
```

### Error Responses

#### Not Found (404)

```json
{
  "success": false,
  "message": "Not Found",
  "error": "Property not found"
}
```

#### Internal Server Error (500)

```json
{
  "success": false,
  "message": "Internal Server Error",
  "error": "An internal server error occurred."
}
```

## Business Logic

### Property Filtering

- Only properties with `status: 'active'` and `deleted_at: null` are returned
- Property is identified by its `uid` (public unique string)

### Data Processing

- Tenant information is limited to public fields only

## Validation Rules

1. **Property UID**: Must be a valid string

## Database Relations Included

- `tenant` (User) - with selected public fields
- `images` (PropertyImage) - active images ordered by `order_index`
- `rooms` (Room) - active rooms with:
  - `images` (RoomImage) - active images ordered by `order_index`
- `room_unavailabilities` (RoomUnavailability) - all unavailability records for the property
- `peak_season_rates` (PeakSeasonRate) - all peak season rate records for the property

## Notes

- All monetary values are returned as Decimal types
- Geographic coordinates are returned as Decimal types
- JSON fields (`amenities`, `rules`, `highlight`) maintain their original structure
- The endpoint is public and does not require authentication
