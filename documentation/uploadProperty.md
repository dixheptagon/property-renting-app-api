# Upload Property API Documentation

## Overview

The `POST /api/properties/upload-property` endpoint handles the finalization of a new property creation process. This endpoint receives a comprehensive JSON payload containing all property details, images, rooms, and related data that has been collected through a multi-step form process.

## Key Features

- **Atomic Transactions**: All database operations are wrapped in a single transaction to ensure data integrity
- **Image Management**: Automatically moves images from temporary Cloudinary folders to permanent locations
- **Complete Property Creation**: Creates property, rooms, images, peak season rates, and unavailabilities in one operation
- **Error Handling**: Full rollback on any failure (including Cloudinary operations)
- **Validation**: Comprehensive input validation using Yup schemas

## Authentication

**Required**: Bearer token authentication

- Header: `Authorization: Bearer <access_token>`
- User must be authenticated as a tenant

## Endpoint

```
POST /api/properties/upload-property
```

## Request Body Structure

The request body must contain a JSON object with the following structure:

```json
{
  "state": {
    "property": {
      "title": "string (required)",
      "category": "house|apartment|hotel|villa|room (required)",
      "description": "string (required)",
      "base_price": "number >= 0 (required)",
      "address": "string (required)",
      "city": "string (required)",
      "country": "string (required)",
      "postal_code": "string (required)",
      "latitude": "number | null",
      "longitude": "number | null",
      "place_id": "string | null",
      "map_url": "string | null",
      "amenities": "string[] | null",
      "custom_amenities": "string[] | null",
      "rules": "string[] | null",
      "custom_rules": "string[] | null"
    },
    "propertyImages": [
      {
        "id": "number (required)",
        "publicId": "string (required)",
        "secureUrl": "string (required)",
        "isMain": "boolean (required)",
        "orderIndex": "number (required)",
        "status": "temp|draft|active|deleted (required)",
        "tempGroupId": "string (required)"
      }
    ],
    "rooms": [
      {
        "tempId": "string (required)",
        "name": "string (required)",
        "description": "string (required)",
        "base_price": "number >= 0 (required)",
        "max_guest": "number >= 1 (required)",
        "total_units": "number >= 1 (required)",
        "bedrooms": "number >= 0 (required)",
        "bathrooms": "number >= 0 (required)",
        "beds": "number >= 0 (required)",
        "highlight": "string[] | null",
        "custom_highlight": "string[] | null",
        "images": [
          {
            "id": "number (required)",
            "publicId": "string (required)",
            "secureUrl": "string (required)",
            "isMain": "boolean (required)",
            "orderIndex": "number (required)",
            "status": "temp|draft|active|deleted (required)",
            "tempGroupId": "string (required)"
          }
        ]
      }
    ],
    "peakSeasonRates": [
      {
        "tempId": "string (required)",
        "targetTempRoomId": "string (required)",
        "start_date": "string (ISO date) (required)",
        "end_date": "string (ISO date) (required)",
        "adjustment_type": "percentage|nominal (required)",
        "adjustment_value": "number (required)"
      }
    ],
    "unavailabilities": [
      {
        "tempId": "string (required)",
        "targetTempRoomId": "string (required)",
        "start_date": "string (ISO date) (required)",
        "end_date": "string (ISO date) (required)",
        "reason": "string | null"
      }
    ]
  },
  "version": "number (required)"
}
```

## Process Flow

1. **Validation**: Input data is validated using Yup schemas
2. **Authentication Check**: Verifies tenant authentication
3. **Database Transaction Start**:
   - Create main Property record
   - Move property images from temp to permanent Cloudinary folder
   - Update PropertyImage records with new URLs
   - For each room:
     - Create Room record
     - Move room images to permanent folder
     - Update RoomImage records
     - Create associated PeakSeasonRate records
     - Create associated RoomUnavailability records
4. **Transaction Commit**: All changes saved atomically
5. **Error Handling**: On any failure, transaction rolls back and Cloudinary operations are reversed

## Image Management

### Temporary Storage

- Property images: `staysia_property_renting_app/temp/{tempGroupId}/...`
- Room images: `staysia_property_renting_app/temp/{tempGroupId}/...`

### Permanent Storage

- Property images: `staysia_property_renting_app/properties/{propertyId}/...`
- Room images: `staysia_property_renting_app/properties/{propertyId}/rooms/{roomId}/...`

## Response Format

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Created",
  "data": {
    "propertyId": 123,
    "message": "Property uploaded successfully"
  }
}
```

### Error Response (4xx/5xx)

```json
{
  "success": false,
  "message": "Validation Error",
  "error": [
    "Title is required",
    "Category must be one of: house, apartment, hotel, villa, room"
  ]
}
```

Or for server errors:

```json
{
  "success": false,
  "message": "Internal Server Error",
  "error": "Failed to upload property"
}
```

## Validation Rules

### Property Validation

- All required fields must be present
- `base_price` must be >= 0
- `category` must be one of the enum values
- Arrays can be null but must be valid string arrays when provided

### Room Validation

- Each room needs a unique `tempId`
- `base_price`, `max_guest`, `total_units`, `bedrooms`, `bathrooms`, `beds` must be >= 0
- At least one image required per room

### Image Validation

- All images must have valid Cloudinary publicId and secureUrl
- Status must be "temp" for processing
- tempGroupId required for grouping

### Date Validation

- Peak season rates and unavailabilities require valid ISO date strings
- `end_date` must be after `start_date`

## Error Scenarios

1. **Validation Error (422)**: Invalid input data structure
2. **Unauthorized (401)**: Missing or invalid authentication token
3. **Cloudinary Error (500)**: Failed to move images
4. **Database Error (500)**: Transaction failure (automatically rolled back)
5. **Internal Server Error (500)**: Unexpected server errors

## Database Changes

The endpoint creates/updates the following records:

- **Property**: 1 record
- **PropertyImage**: Multiple records (one per image)
- **Room**: Multiple records (one per room)
- **RoomImage**: Multiple records (one per room image)
- **PeakSeasonRate**: Multiple records (filtered by room)
- **RoomUnavailability**: Multiple records (filtered by room)

All records are linked with proper foreign keys and relationships.

## Security Considerations

- Authentication required for all requests
- Input validation prevents malicious data injection
- Transaction rollback prevents partial data corruption
- Cloudinary operations are atomic with database changes

## Performance Notes

- Large payloads may take time due to multiple Cloudinary rename operations
- Consider payload size limits for production deployment
- Database transaction ensures consistency but may hold locks during processing

## Example Usage

```javascript
const response = await fetch('/api/properties/upload-property', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-access-token'
  },
  body: JSON.stringify({
    state: {
      property: {
        title: "Luxury Apartment in Tokyo",
        category: "apartment",
        description: "Beautiful apartment with city views",
        base_price: 150000,
        address: "1-2-3 Shibuya, Shibuya-ku",
        city: "Tokyo",
        country: "Japan",
        postal_code: "150-0001",
        amenities: ["wifi", "parking"],
        custom_amenities: ["Ocean view"]
      },
      propertyImages: [...],
      rooms: [...],
      peakSeasonRates: [...],
      unavailabilities: [...]
    },
    version: 1
  })
});

const result = await response.json();
```

## Testing

Use the provided JSON structure from the task description for testing. Ensure all temp images exist in Cloudinary before calling this endpoint.
