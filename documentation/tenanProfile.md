# Tenant Profile Verification Feature - BackEnd Implementation

## Overview

This document outlines the complete frontend implementation of the Tenant Profile Verification feature for the Property Renting App. The feature allows tenants to submit verification documents and track their verification status.

### POST /api/auth/tenant-profile/verification

**Purpose**: Submit verification form with file upload
**Hook**: `useTenantVerification`
**Request**: FormData with fields:

- `contact` (string)
- `address` (string)
- `city` (string)
- `country` (string)
- `government_id_type` (string)
- `government_id_file` (File - PDF only)
  **Response**:

```typescript
{
  success: boolean;
  message: string;
}
```

## Form Validation

### (Yup Schema)

```typescript
TenantVerificationSchema = {
  contact: string().required().matches(phoneRegex).min(7).max(20),
  address: string().required().min(5).max(255),
  city: string().required().min(2).max(100),
  country: string().required().min(2).max(100),
  government_id_type: string()
    .required()
    .oneOf(['KTP', 'Passport', "Driver's License"]),
  government_id_file: mixed().required().test(fileSize).test(fileType),
};
```

## Backend Requirements

The frontend implementation assumes the following backend endpoints and behaviors. Please ensure the backend implements these exactly as specified.

---

# Backend Implementation Requirements

## Required API Endpoints

### 1. GET /api/tenant-profile

**Authentication**: Required (Bearer token)
**Purpose**: Retrieve current user's tenant profile data

**Request**:

```
GET /api/tenant-profile
Authorization: Bearer <token>
```

**Response (Success)**:

```json
{
  "success": true,
  "data": {
    "id": 123,
    "user_id": 456,
    "balance": 0.0,
    "contact": "+6281234567890",
    "government_id_type": "KTP",
    "government_id_path": "https://example.com/uploads/tenant_123_gov_id.pdf",
    "address": "Jl. Sudirman No. 123",
    "city": "Jakarta",
    "country": "Indonesia",
    "verified": true,
    "verified_at": "2025-11-03T06:00:00.000Z",
    "banned": false,
    "created_at": "2025-10-01T00:00:00.000Z",
    "updated_at": "2025-11-03T06:00:00.000Z",
    "deleted_at": null
  }
}
```

**Response (No Profile)**:

```json
{
  "success": true,
  "data": null
}
```

**Response (Error)**:

```json
{
  "success": false,
  "message": "Failed to fetch profile"
}
```

### 2. POST /api/auth/tenant-profile/verification

**Authentication**: Required (Bearer token)
**Purpose**: Submit tenant verification form with file upload

**Request**:

```
POST /api/auth/tenant-profile/verification
Authorization: Bearer <token>
Content-Type: multipart/form-data

FormData:
- contact: string (phone number)
- address: string
- city: string
- country: string
- government_id_type: string ("KTP" | "Passport" | "Driver's License")
- government_id_file: File (PDF only, max 1MB)
```

**Response (Success)**:

add any needed response, if usefull for Client

```json
{
  "success": true,
  "message": "Verification submitted successfully"
}
```

**Response (Validation Error)**:

```json
{
  "success": false,
  "message": "Invalid file format. Only PDF files are allowed."
}
```

**Response (Server Error)**:

```json
{
  "success": false,
  "message": "Failed to process verification request"
}
```

## Database Schema Requirements

### TenantProfile Model

The backend must implement the Prisma model exactly as specified:

```prisma
model TenantProfile {
  id                   Int       @id @default(autoincrement())
  user_id              Int       @unique
  balance              Decimal   @default(0) @db.Decimal(12, 2)
  contact              String    @db.VarChar(20)
  government_id_type   String
  government_id_path   String    // Stores file URL/path
  address              String
  city                 String
  country              String
  verified             Boolean   @default(false)
  verified_at          DateTime?
  banned               Boolean   @default(false)
  created_at           DateTime  @default(now())
  updated_at           DateTime? @updatedAt
  deleted_at           DateTime?

  // Relations
  user User @relation(fields: [user_id], references: [id])
}
```

## File Upload Requirements

### Storage Configuration

- **File Format**: Accept only PDF files
- **Size Limit**: Maximum 1MB per file
- **Storage**: Cloud storage using Cloudinary
- **Naming**: Unique file names to prevent conflicts
- **Security**: Proper file validation server-side

### File Processing Steps

1. **Validate file type** (server-side check)
2. **Validate file size** (server-side check)
3. **Generate unique filename**
4. **Upload file to storage**
5. **Update database** with file path
6. **Return success/error response**

## Business Logic Requirements

### Verification Workflow

1. **Initial State**: User has no TenantProfile or unverified profile
2. **Form Submission**: User submits form with file
3. **Processing**: Backend validates and stores data
4. **Status Update**: Set verified = true

### Error Handling

- **Authentication errors**: Return 401 with proper message
- **Validation errors**: Return 400 with specific error messages
- **File upload errors**: Handle storage failures gracefully
- **Database errors**: Proper error logging and user-friendly messages

## Security Requirements

### Authentication & Authorization

- **JWT Validation**: Verify Bearer tokens properly
- **User Context**: Ensure users can only access their own profiles
- **File Access**: Secure file URLs or proper access controls

### Input Validation

- **Sanitization**: Clean all text inputs
- **File Validation**: Server-side file type and size checks
- **SQL Injection**: Use parameterized queries
- **XSS Prevention**: Proper output encoding

### File Security

- **Access Control**: Restrict file access to authenticated users

## Testing Requirements

### API Testing

- **Success scenarios**: All valid inputs work correctly
- **Error scenarios**: Proper error responses for invalid inputs
- **Authentication**: Proper token validation
- **File uploads**: Various file types and sizes

### Integration Testing

- **Database operations**: Proper data persistence
- **File storage**: Successful upload and retrieval
- **Cache invalidation**: Frontend cache updates correctly
