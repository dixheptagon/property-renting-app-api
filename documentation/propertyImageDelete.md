# Property Image Delete API

## Overview

This API endpoint allows deleting property images from both the database and Cloudinary storage. It supports both single image deletion and group deletion by `temp_group_id`. It ensures data consistency using Prisma SQL transactions and handles main image reassignment automatically.

## Endpoints

```
DELETE /properties/images/:imageId (single image deletion)
DELETE /properties/images (group deletion by temp_group_id)
```

## Request Parameters

### Single Image Deletion

- `imageId` (path parameter): The ID of the image to delete (integer)

### Group Deletion

- `temp_group_id` (body parameter): String identifier for the group of images to delete

## Request Body (for group deletion)

```json
{
  "temp_group_id": "group-uuid-here"
}
```

## Response

### Single Image Success Response (200 OK)

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "message": "Image deleted successfully",
    "deletedImages": [
      {
        "id": 123,
        "publicId": "temp/uuid-here",
        "tempGroupId": null
      }
    ],
    "totalDeleted": 1
  }
}
```

### Group Deletion Success Response (200 OK)

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "message": "Images deleted successfully",
    "deletedImages": [
      {
        "id": 123,
        "publicId": "temp/uuid-1",
        "tempGroupId": "group-uuid"
      },
      {
        "id": 124,
        "publicId": "temp/uuid-2",
        "tempGroupId": "group-uuid"
      }
    ],
    "totalDeleted": 2
  }
}
```

### Error Responses

- **400 Bad Request**: Invalid parameters or missing required fields
- **404 Not Found**: Image(s) not found
- **500 Internal Server Error**: Database or Cloudinary errors

## Logic Flow

### Single Image Deletion

1. **Validation**: Validate the `imageId` parameter
2. **Transaction Start**: Begin Prisma transaction
3. **Find Image**: Query the image by ID
4. **Extract Public ID**: Parse Cloudinary public_id from the image URL
5. **Database Deletion**: Delete the image record from the database
6. **Cloudinary Deletion**: Delete the image from Cloudinary storage
7. **Main Image Handling**: If the deleted image was main, assign another image as main
8. **Transaction Commit**: Commit all changes

### Group Deletion

1. **Validation**: Validate the `temp_group_id` parameter
2. **Transaction Start**: Begin Prisma transaction
3. **Find Images**: Query all images with matching `temp_group_id`
4. **Process Each Image**: For each image:
   - Extract Cloudinary public_id from URL
   - Delete from database
   - Delete from Cloudinary
5. **Transaction Commit**: Commit all changes
6. **Error Handling**: Rollback on failure, log Cloudinary cleanup errors

## Key Features

### Transaction Safety

- Uses Prisma `$transaction` for atomic operations
- Ensures database consistency even if Cloudinary deletion fails

### Draft Upload Support

- `temp_group_id` allows grouping images for draft uploads
- Supports bulk deletion of draft image groups
- Maintains data integrity across grouped operations

### Main Image Reassignment

- Automatically sets another image as main if the current main image is deleted
- Only applies to single image deletion (not group deletion)
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

## Usage Examples

### Single Image Deletion

```typescript
// Route: DELETE /properties/images/123
// No body required, imageId from URL parameter
```

### Group Deletion

```typescript
// Route: DELETE /properties/images
// Body: { "temp_group_id": "draft-session-uuid" }
```

## Notes

- Either `imageId` (path param) or `temp_group_id` (body param) must be provided
- The controller assumes images are stored in Cloudinary with standard URL format
- Main image reassignment only occurs for single image deletion when `property_id` is not null
- Cloudinary deletion failures are logged but don't rollback the database transaction
- Group deletion does not perform main image reassignment (use single deletion for that)
