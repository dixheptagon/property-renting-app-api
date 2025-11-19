# Temporary Property Image Upload Architecture

## Overview

This document outlines the architecture and security considerations for the temporary image upload system implemented for property creation in the Property Renting App API. The system uses SQL transactions and automatic Cloudinary cleanup to ensure data consistency.

## Two-Step Upload Process

### 1. Temporary Upload

- **Endpoint**: `POST /properties/upload-property-images`
- **Purpose**: Immediate upload of images upon user selection
- **Storage**: Cloudinary `temp/` folder
- **Status**: Images remain in temporary state until final form submission

### 2. Activation

- **Process**: Images are moved from `temp` to `active` status upon successful property creation
- **Implementation**: Handled by a separate controller (not included in this implementation)

## Transaction and Consistency

### SQL Transactions

- **Atomic Operations**: All database operations are wrapped in Prisma transactions (`database.$transaction`)
- **Rollback on Failure**: If any upload or database operation fails, all changes are automatically rolled back
- **Consistency Guarantee**: Either all images are saved or none are, maintaining data integrity

### Cloudinary Cleanup

- **Automatic Cleanup**: On transaction failure, all successfully uploaded Cloudinary images are automatically deleted
- **Cleanup Function**: Uses `cloudinaryDeleteTempPropertyImage()` helper for safe image removal
- **Error Handling**: Cleanup errors are logged but don't interfere with the main error response

## Security Checks

### File Validation

- **MIME Type Check**: Only allows `image/jpeg`, `image/png`, `image/jpg`, and `image/webp`
- **File Size Limit**: Maximum 5MB per image
- **Multiple Files**: Supports up to 10 images per request

### Cloudinary Configuration

- **Folder Structure**: All temporary images stored in `temp/` folder
- **Public ID Generation**: Uses UUID prefixed with folder path (e.g., `temp/a1b2c3d4-e5f6...`)
- **Unique Identification**: Each upload gets a unique identifier to prevent conflicts

## Cleanup Strategy

### Temporary File Management

- **Retention Period**: Temporary images should be cleaned up periodically
- **Cron Job Requirement**: Implement a scheduled job to remove unused temporary images
- **Cleanup Criteria**:
  - Images older than 24 hours
  - Images not associated with any property creation process
  - Failed or abandoned uploads

### Recommended Cron Job Implementation

```typescript
// Example cron job (to be implemented separately)
const cleanupTempImages = async () => {
  // Query Cloudinary API for temp/ folder
  // Delete images older than threshold
  // Log cleanup operations
};
```

## Database Integration

- **PropertyImage Model**: Images are immediately saved to the database with status 'temp'
- **Main Image**: First uploaded image is automatically set as main (`is_main: true`)
- **Order Index**: Images are ordered by upload sequence (0-based)
- **Status Management**: Images start with 'temp' status and can be changed to 'active' during property creation
- **Future Association**: Images will be linked to properties during activation phase

## Error Handling

- **Validation Errors**: Returns 400 Bad Request with specific error messages
- **Upload Failures**: Returns 500 Internal Server Error with generic message
- **Transaction Rollback**: Automatic database rollback on any failure
- **Cloudinary Cleanup**: Automatic deletion of uploaded images on failure
- **Cleanup Logging**: Failed cleanup attempts are logged without affecting error response

## Response Format

- **Success (201)**: Returns array of objects with `id`, `publicId`, `secureUrl`, `isMain`, `orderIndex`, and `status`
- **Error**: Uses standardized error response format

## Security Considerations

- **Input Sanitization**: All file inputs are validated before processing
- **Rate Limiting**: Consider implementing rate limits on upload endpoints
- **Authentication**: Ensure endpoint is protected (not implemented in this controller)
- **CORS**: Configure appropriate CORS policies for frontend access

## Performance Notes

- **Asynchronous Processing**: Uploads are processed asynchronously
- **Batch Upload**: Supports multiple files in single request
- **Memory Management**: Uses Multer memory storage to avoid disk I/O
- **Transaction Efficiency**: Single transaction for all database operations
- **Parallel Cleanup**: Uses `Promise.allSettled` for efficient Cloudinary cleanup
