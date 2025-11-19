# Get Order List API

## Endpoint

GET /booking/get-order-list

## Description

Retrieves a list of orders for the authenticated user, with filtering and pagination options.

## Query Parameters

- `user_id` (required): The ID of the user.
- `page` (optional): Page number, default 1.
- `limit` (optional): Number of items per page, default 20, max 50.
- `order_id` (optional): Partial search on order number (uid).
- `date_from` (optional): Start date for filtering (ISO format, on created_at).
- `date_to` (optional): End date for filtering (ISO format, on created_at).
- `status` (optional): Filter by status (pending_payment, processing, confirmed, cancelled, completed).
- `sort_by` (optional): Sort by field (created_at or check_in_date), default created_at.
- `sort_dir` (optional): Sort direction (asc or desc), default desc.

## Response

### Success (200)

```json
{
  "success": true,
  "message": "Orders retrieved successfully",
  "data": {
    "data": [
      {
        "order_id": "ORD-12345",
        "room": {
          "name": "Deluxe Room",
          "description": "A comfortable room",
          "property": {
            "name": "Hotel ABC",
            "address": "123 Main St",
            "city": "Jakarta"
          }
        },
        "status": "confirmed",
        "check_in_date": "2025-10-05",
        "check_out_date": "2025-10-07",
        "total_price": 500.0,
        "created_at": "2025-09-01T10:00:00Z"
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

Invalid parameters.

### Error (404)

No orders found.
