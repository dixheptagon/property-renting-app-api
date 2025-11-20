# Set Properties Main Image API

## Overview

This API endpoint allows setting a specific image as the main image for either a property or a temporary image group. It ensures only one image is marked as main within the specified scope using atomic database transactions.

## Endpoint

```
PUT /properties/images/:imageId/set-main
```

## Request Parameters

- `imageId` (path parameter): The ID of the image to set as main (integer)

## Request Body

Provide either `property_id` OR `temp_group_id` (not both):

### For Property Images

```json
{
  "property_id": 123
}
```

### For Temporary Image Groups

```json
{
  "temp_group_id": "draft-session-uuid"
}
```

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "message": "Main image updated successfully",
    "imageId": 456,
    "isMain": true,
    "propertyId": 123,
    "tempGroupId": null
  }
}
```

### Error Responses

- **400 Bad Request**:
  - Invalid image ID format
  - Missing or invalid property_id/temp_group_id
  - Providing both property_id and temp_group_id
  - Image doesn't belong to specified property/group
- **404 Not Found**: Image not found

## Logic Flow

1. **Validation**: Validate `imageId` and request body parameters
2. **Existence Check**: Verify the target image exists
3. **Ownership Verification**: Ensure image belongs to specified property or temp group
4. **Transaction Start**: Begin Prisma transaction
5. **Reset Other Images**: Set `is_main = false` for all other images in the same scope
6. **Set Main Image**: Update target image to `is_main = true`
7. **Transaction Commit**: Commit all changes atomically

## Key Features

### Scope-Based Operation

- **Property Scope**: Operates on images belonging to a specific property (`property_id`)
- **Temp Group Scope**: Operates on images in a temporary upload session (`temp_group_id`)

### Atomic Transactions

- Uses Prisma `$transaction` for consistency
- All changes succeed or fail together
- Prevents partial updates

### Validation & Security

- Validates image ownership before allowing changes
- Prevents setting main image for wrong property/group
- Comprehensive input validation

### Single Main Image Guarantee

- Automatically unsets previous main image in the same scope
- Ensures only one main image per property/temp group

## Dependencies

- Express.js
- Prisma ORM
- Custom error handling utilities

## Usage Examples

### Set Main Image for Property

```typescript
PUT /properties/images/456/set-main
Body: { "property_id": 123 }
```

### Set Main Image for Temp Group

```typescript
PUT /properties/images/789/set-main
Body: { "temp_group_id": "draft-abc-123" }
```

## Notes

- Either `property_id` or `temp_group_id` must be provided (not both)
- The image must exist and belong to the specified scope
- Previous main image in the same scope is automatically unset
- Operation is atomic and transactional
