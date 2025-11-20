# Get Property List by Tenant API

## Endpoint

GET /tenant/get-property-list

## Description

Retrieves a list of properties owned by the authenticated tenant, with filtering, sorting, and pagination options. Only tenants can access this endpoint, and they can only see their own properties. The response includes property details, location information, and review summaries.

## Authentication

Requires authentication with tenant role.

## Testing with Dummy Authentication

For testing purposes, the endpoint uses a dummy authentication middleware that reads user information from the `x-user` header. Include this header in your requests:

```
x-user: {"id": 1, "email": "tenant@example.com", "role": "tenant"}
```

Replace the `id` with a valid tenant user ID from your database.

## Query Parameters

- `page` (optional): Page number, default 1.
- `limit` (optional): Number of items per page, default 20, max 50.
- `status` (optional): Filter by property status (draft, active, deleted).
- `category` (optional): Filter by property category (house, apartment, hotel, villa, room).
- `sort_by` (optional): Sort by field (created_at, updated_at, title, base_price), default created_at.
- `sort_dir` (optional): Sort direction (asc or desc), default desc.

## Response

### Success (200)

```json
{
  "success": true,
  "message": "Property list retrieved successfully",
  "data": {
    "data": [
      {
        "uid": "PROP-12345",
        "category": "house",
        "status": "active",
        "title": "Beautiful Beach House",
        "location": {
          "address": "123 Ocean Drive",
          "city": "Bali",
          "country": "Indonesia",
          "latitude": -8.3405,
          "longitude": 115.092
        },
        "review_summary": {
          "average_rating": 4.5,
          "review_count": 12
        },
        "main_image": "https://example.com/image.jpg",
        "created_at": "2025-01-15T10:30:00.000Z",
        "updated_at": "2025-01-20T14:45:00.000Z"
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 20,
      "totalPages": 2,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Error (400)

Invalid query parameters.

```json
{
  "success": false,
  "message": "Invalid status parameter. Valid values: draft, active, deleted"
}
```

### Error (401)

Authentication required.

```json
{
  "success": false,
  "message": "Authentication required"
}
```

### Error (403)

Access denied - not a tenant.

```json
{
  "success": false,
  "message": "Access denied. Tenant role required."
}
```

## Business Rules

- Only authenticated users with tenant role can access this endpoint.
- Tenants can only view properties they own.
- Default sorting is by created_at in descending order (newest first).
- Sorting can be customized with sort_by (created_at, updated_at, title, base_price) and sort_dir (asc, desc).
- Filtering supports status (draft, active, deleted) and category (house, apartment, hotel, villa, room).
- Review summary includes average rating (calculated from public reviews) and total review count.
- Main image is the primary image marked as is_main from active property images.
- Pagination supports page and limit parameters with navigation indicators.

## Implementation Details

- **Controller**: `GetPropertyListByTenantController` in `src/routers/tenant-transactions/get-property-list/get.property.list.controller.ts`
- **Service**: `GetPropertyListService.getPropertyListByTenant` in `src/routers/tenant-transactions/get-property-list/get.property.list.service.ts`
- Uses Prisma ORM with joins to property images and reviews tables.
- Follows clean architecture with separation of concerns between controller and service layers.
- Includes proper error handling and validation for all query parameters.
