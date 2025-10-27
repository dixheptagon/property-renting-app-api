# Property Image Delete API

## Overview

This API endpoint allows deleting a property image from both the database and Cloudinary storage. It ensures data consistency using Prisma SQL transactions and handles main image reassignment automatically.

## Endpoint

```
DELETE /properties/images/:imageId
```

## Request Parameters

- `imageId` (path parameter): The ID of the image to delete (integer)

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "message": "Image deleted successfully",
    "deletedImageId": 123,
    "publicId": "temp/uuid-here"
  }
}
```

### Error Responses

- **400 Bad Request**: Invalid image ID format
- **404 Not Found**: Image not found
- **500 Internal Server Error**: Database or Cloudinary errors

## Logic Flow

1. **Validation**: Validate the `imageId` parameter
2. **Transaction Start**: Begin Prisma transaction
3. **Find Image**: Query the image by ID
4. **Extract Public ID**: Parse Cloudinary public_id from the image URL
5. **Database Deletion**: Delete the image record from the database
6. **Cloudinary Deletion**: Delete the image from Cloudinary storage
7. **Main Image Handling**: If the deleted image was main, assign another image as main
8. **Transaction Commit**: Commit all changes
9. **Error Handling**: Rollback on failure, log Cloudinary cleanup errors

## Key Features

### Transaction Safety

- Uses Prisma `$transaction` for atomic operations
- Ensures database consistency even if Cloudinary deletion fails

### Main Image Reassignment

- Automatically sets another image as main if the deleted image was the main one
- Selects the next image based on `order_index` (ascending)

### Cloudinary Integration

- Extracts `public_id` from Cloudinary URLs
- Handles deletion from any folder (temp, active, etc.)
- Logs cleanup errors without failing the operation

### Error Handling

- Comprehensive try/catch blocks
- Custom error classes for consistent responses
- Cloudinary errors are logged but don't prevent successful DB deletion

## Dependencies

- Express.js
- Prisma ORM
- Cloudinary SDK
- Custom error handling utilities

## Usage Example

```typescript
// Controller usage in route
router.delete('/properties/images/:imageId', propertyImageDeleteController);
```

## Notes

- The controller assumes images are stored in Cloudinary with standard URL format
- Main image reassignment only occurs if the image belongs to a property (`property_id` is not null)
- Cloudinary deletion failures are logged but don't rollback the database transaction
