# Get Owned Property IDs API Documentation

## Overview

The Get Owned Property IDs endpoint allows authenticated tenant users to retrieve a simple list of their owned properties, returning only the basic identification information (ID, UID, and title). This endpoint is designed for quick property selection in dropdowns, forms, or navigation menus.

## Authentication

This endpoint requires authentication via a JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

The JWT payload should contain:

```json
{
  "uid": "user-uuid",
  "email": "user@example.com",
  "role": "tenant"
}
```

The middleware `@/src/lib/middlewares/verify.token.ts` handles JWT verification and populates `req.user` with the decoded payload.

## Endpoint

### Get Owned Property IDs

**GET** `/api/properties/my-properties`

Retrieve basic information for all properties owned by the authenticated tenant.

#### Authentication

- Required: JWT token in `Authorization` header (tenant user only)

#### Query Parameters

None

#### Business Rules

- Only returns properties belonging to the authenticated user
- User must have role = `tenant`
- Returns properties in alphabetical order by title

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Owned properties retrieved successfully",
  "data": {
    "properties": [
      {
        "id": 1,
        "uid": "PROP-ABC123",
        "title": "Beautiful Beach Villa"
      },
      {
        "id": 2,
        "uid": "PROP-DEF456",
        "title": "City Center Apartment"
      },
      {
        "id": 3,
        "uid": "PROP-GHI789",
        "title": "Mountain View Cabin"
      }
    ]
  }
}
```

#### Response Fields

- `properties`: Array of property objects
  - `id`: Internal property ID (number)
  - `uid`: Unique property identifier (string)
  - `title`: Property title/name (string)

#### Error Responses

- `401 Unauthorized`: User not authenticated or user ID not found
- `403 Forbidden`: User is not a tenant

#### Notes

- This endpoint returns minimal property information for performance
- Properties are sorted alphabetically by title
- No pagination is implemented - returns all owned properties
- Designed for use in selection components, navigation menus, or form dropdowns
- For detailed property information, use the property details endpoint

## Database Query

The endpoint performs the following database operations:

1. Validates JWT token and extracts user UID
2. Finds user by UID to get internal user ID
3. Queries properties where `user_id` matches the authenticated tenant
4. Selects only `id`, `uid`, and `title` fields
5. Orders results by `title` in ascending order

## Use Cases

- Populate property selection dropdowns in tenant dashboards
- Display property lists in navigation menus
- Provide property options in booking management forms
- Quick property lookup for tenant interfaces
- Property selection in review or management contexts

## Response Structure

The response provides a clean, minimal structure focused on property identification. Each property object contains the essential fields needed for selection and reference purposes.

## Performance Considerations

- No complex joins or includes - only basic property fields
- No pagination - suitable for tenants with reasonable numbers of properties
- Optimized for quick response times
- Minimal data transfer
