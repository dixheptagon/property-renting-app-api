# Move Property Images API

## Endpoint

```
POST /api/properties/move-images/:propertyId
```

## Description

Moves property and room images from temporary Cloudinary folders to permanent property-specific folders and updates the database with new public IDs and URLs.

## Authentication

- Requires Bearer token authentication
- Only the property owner (tenant) can move images for their properties

## Parameters

- `propertyId` (URL parameter): The ID of the property whose images need to be moved

## Request

```http
POST /api/properties/move-images/123
Authorization: Bearer <your-jwt-token>
```

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "message": "Property images moved successfully",
    "propertyId": 123
  }
}
```

### Error Responses

#### 400 Bad Request

```json
{
  "success": false,
  "message": "Bad Request",
  "error": "Valid propertyId is required"
}
```

#### 401 Unauthorized

```json
{
  "success": false,
  "message": "Unauthorized",
  "error": "Tenant not authenticated"
}
```

#### 404 Not Found

```json
{
  "success": false,
  "message": "Not Found",
  "error": "Property not found or does not belong to tenant"
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Internal Server Error",
  "error": "Failed to move property images"
}
```

## Process Flow

1. **Authentication Check**: Verifies the user is authenticated and owns the property
2. **Find Temp Images**: Queries database for property and room images with `public_id` starting with `staysia_property_renting_app/temp`
3. **Move Property Images**: Moves each property image to `staysia_property_renting_app/properties/{propertyId}/{filename}`
4. **Move Room Images**: For each room, moves images to `staysia_property_renting_app/properties/{propertyId}/rooms/{roomId}/{filename}`
5. **Update Database**: Updates `public_id` and `url` fields in the database with new Cloudinary paths
6. **Transaction Safety**: All operations are wrapped in a database transaction - if any step fails, all changes are rolled back

## Usage Example

```javascript
// After successfully uploading a property, move the images
const response = await fetch('/api/properties/move-images/123', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer your-jwt-token',
    'Content-Type': 'application/json',
  },
});

const result = await response.json();
console.log(result); // { success: true, data: { message: "Property images moved successfully", propertyId: 123 } }
```

## Notes

- This endpoint should be called after the property upload is successful
- Images are moved from temporary folders to permanent organized folders
- The operation is atomic - either all images are moved or none are
- Console logs are available for debugging the image moving process
- Only moves images that haven't been moved yet (checks for temp folder prefix)
