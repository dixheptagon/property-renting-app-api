# Upload Payment Proof API

## Overview

This API endpoint allows users to upload payment proof for bookings that are in `pending_payment` status. The uploaded image is stored in Cloudinary, and the booking status is updated to `processing`.

## Endpoint

```
POST /booking/:orderId/upload-payment-proof
```

## Request

- **Method**: POST
- **Content-Type**: multipart/form-data
- **Parameters**:
  - `orderId` (path parameter): The unique identifier of the booking order (string)
- **Body**:
  - `payment_proof` (file): The payment proof image file

## File Constraints

- **Allowed Types**: Images only (jpg, jpeg, png)
- **Max Size**: 1 MB
- **Storage**: Memory storage using Multer

## Business Rules

- Only bookings with `status: "pending_payment"` can upload payment proof
- After successful upload, booking status is updated to `"processing"`
- The payment proof URL is stored in the `payment_proof` field of the booking record

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Payment proof uploaded successfully",
  "data": {
    "payment_proof": "https://cloudinary.com/.../payment_proof.jpg"
  }
}
```

### Error Responses

#### Bad Request (400)

- Invalid order ID
- Booking not in pending_payment status
- No file uploaded
- Invalid file type or size exceeded

```json
{
  "success": false,
  "error": "Error message description"
}
```

#### Not Found (404)

- Booking not found

```json
{
  "success": false,
  "error": "Booking not found"
}
```

#### Internal Server Error (500)

- Cloudinary upload failure
- Database update failure

```json
{
  "success": false,
  "error": "Failed to upload payment proof to cloud storage"
}
```

## Implementation Details

### Middleware

- **Multer**: Handles file upload with memory storage
  - File size limit: 1MB
  - File filter: Images only
  - Field name: `payment_proof`

### Cloud Storage

- **Cloudinary**: Stores uploaded images in a dedicated folder
- Folder path configured via `CLOUD_PAYMENT_PROOF_FOLDER_PATH` environment variable

### Database Updates

- Updates `payment_proof` field with Cloudinary secure URL
- Changes `status` from `pending_payment` to `processing`

### Error Handling

- File validation errors are handled by Multer middleware
- Business logic errors are handled in the controller
- All errors are passed to the global error handler

## Architecture

- **Controller**: `UploadPaymentProofController` - Handles request validation, business logic, and response
- **Service**: Cloudinary upload utility - Handles file upload to cloud storage
- **Middleware**: Multer configuration - Handles file upload constraints
- **Database**: Prisma ORM - Handles booking record updates

## Dependencies

- `multer`: File upload handling
- `cloudinary`: Cloud storage
- `prisma`: Database ORM
- `express`: Web framework

## Environment Variables

- `CLOUD_NAME`: Cloudinary cloud name
- `CLOUD_API_KEY`: Cloudinary API key
- `CLOUD_API_SECRET`: Cloudinary API secret
- `CLOUD_PAYMENT_PROOF_FOLDER_PATH`: Cloudinary folder for payment proofs
