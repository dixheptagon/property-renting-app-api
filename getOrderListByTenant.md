# Get Order List by Tenant API

## Endpoint

GET /tenant/get-order-list

## Description

Retrieves a list of orders for properties owned by the authenticated tenant, with filtering and pagination options. Only tenants can access this endpoint, and they can only see orders related to their own properties.

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
- `status` (optional): Filter by booking status (pending_payment, processing, confirmed, cancelled, completed).
- `date_from` (optional): Start date for filtering on check_in_date (YYYY-MM-DD format).
- `date_to` (optional): End date for filtering on check_in_date (YYYY-MM-DD format).
- `sort_by` (optional): Sort by field (created_at, check_in_date, total_price), default created_at.
- `sort_dir` (optional): Sort direction (asc or desc), default desc.

## Response

### Success (200)

```json
{
  "success": true,
  "message": "Order list retrieved successfully",
  "data": {
    "data": [
      {
        "orderId": "ORD-12345",
        "status": "confirmed",
        "check_in_date": "2025-10-05T00:00:00.000Z",
        "check_out_date": "2025-10-07T00:00:00.000Z",
        "total_price": 500.0,
        "property": {
          "name": "Hotel ABC",
          "address": "123 Main St",
          "city": "Jakarta"
        },
        "room": {
          "name": "Deluxe Room",
          "description": "A comfortable room with city view"
        },
        "user": {
          "name": "John Doe",
          "email": "john.doe@example.com"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "total_pages": 1
    }
  }
}
```

### Error (400)

Invalid query parameters.

```json
{
  "success": false,
  "message": "Invalid status parameter"
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
- Tenants can only view orders for properties they own.
- Default sorting is by created_at in descending order (newest first).
- Sorting can be customized with sort_by (created_at, check_in_date, total_price) and sort_dir (asc, desc).
- Date filtering is applied on check_in_date.
- Pagination supports page and limit parameters.

## Implementation Details

- **Controller**: `GetOrderListByTenantController` in `src/routers/tenant-transactions/get-order-list/get.order.list.controller.ts`
- **Service**: `GetOrderListService.getOrderListByTenant` in `src/routers/tenant-transactions/get-order-list/get.order.list.service.ts`
- Uses Prisma ORM with joins to property, room, and user tables.
- Follows clean architecture with separation of concerns.
