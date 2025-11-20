# Get My Booking List API

## Endpoint

GET /booking/my-bookings

## Description

Retrieves a list of bookings for the authenticated user, with filtering, pagination, and total completed count. This endpoint uses JWT token authentication to automatically identify the user.

## Authentication

Requires Bearer token in Authorization header. The user ID is extracted from the JWT token via `verifyToken` middleware.

## Query Parameters

- `page` (optional): Page number, default 1.
- `limit` (optional): Number of items per page, default 20, max 50.
- `order_id` (optional): Partial search on order number (uid).
- `date_from` (optional): Start date for filtering (YYYY-MM-DD format, filters on created_at).
- `date_to` (optional): End date for filtering (YYYY-MM-DD format, filters on created_at).
- `status` (optional): Filter by status (pending_payment, processing, confirmed, cancelled, completed).
- `sort_by` (optional): Sort by field (created_at, check_in_date, total_price), default created_at.
- `sort_dir` (optional): Sort direction (asc or desc), default desc.

## Response

### Success (200)

```json
{
  "success": true,
  "message": "Bookings retrieved successfully",
  "data": {
    "data": [
      {
        "order_id": "ORD-12345",
        "room": {
          "name": "Deluxe Room",
          "description": "A comfortable room with city view",
          "property": {
            "name": "Hotel ABC",
            "address": "123 Main Street",
            "city": "Jakarta"
          }
        },
        "status": "confirmed",
        "check_in_date": "2025-10-05T00:00:00.000Z",
        "check_out_date": "2025-10-07T00:00:00.000Z",
        "total_price": 500.0,
        "created_at": "2025-09-01T10:00:00.000Z"
      }
    ],
    "total_completed": 5,
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 25,
      "total_pages": 2
    }
  }
}
```

### Error Responses

#### Unauthorized (401)

```json
{
  "success": false,
  "message": "User not authenticated"
}
```

#### Bad Request (400)

```json
{
  "success": false,
  "message": "Invalid status",
  "data": "Invalid status parameter"
}
```

#### Not Found (404)

```json
{
  "success": false,
  "message": "No orders found matching the criteria"
}
```

## Features

### Authentication & Authorization

- Uses JWT token authentication
- Automatically extracts user ID from token
- No need to pass user_id as query parameter

### Date Handling

- All dates are normalized to Asia/Jakarta timezone (UTC+7)
- Input dates should be in YYYY-MM-DD format
- Output dates are returned as ISO strings in Jakarta timezone

### Filtering Options

- **Order ID**: Partial match search on booking UID
- **Date Range**: Filter by booking creation date
- **Status**: Filter by booking status
- **Pagination**: Standard page/limit pagination
- **Sorting**: Multiple sort fields with asc/desc direction

### Response Data

- **Booking List**: Array of user's bookings with room and property details
- **Total Completed**: Count of user's completed bookings
- **Pagination Info**: Current page, limit, total records, total pages

## Frontend Integration

### Making the API Call

```javascript
// Using fetch
const fetchMyBookings = async (params = {}) => {
  const token = localStorage.getItem('authToken'); // Get token from storage

  const queryParams = new URLSearchParams({
    page: params.page || 1,
    limit: params.limit || 20,
    ...params, // Include other filters like status, date_from, etc.
  });

  const response = await fetch(`/api/booking/my-bookings?${queryParams}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch bookings');
  }

  return await response.json();
};

// Using axios
import axios from 'axios';

const fetchMyBookings = async (params = {}) => {
  const token = localStorage.getItem('authToken');

  const response = await axios.get('/api/booking/my-bookings', {
    params: {
      page: params.page || 1,
      limit: params.limit || 20,
      ...params,
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};
```

### Usage Examples

```javascript
// Get first page with default settings
const bookings = await fetchMyBookings();

// Get specific page with filters
const filteredBookings = await fetchMyBookings({
  page: 2,
  limit: 10,
  status: 'confirmed',
  date_from: '2025-01-01',
  date_to: '2025-12-31',
  sort_by: 'created_at',
  sort_dir: 'desc',
});

// Search by order ID
const searchResults = await fetchMyBookings({
  order_id: 'ORD-123',
});
```

### Handling Response

```javascript
const { data, success, message } = await fetchMyBookings();

if (success) {
  const { data: bookings, total_completed, pagination } = data;

  console.log(`Total completed bookings: ${total_completed}`);
  console.log(`Current page: ${pagination.page}/${pagination.total_pages}`);
  console.log(`Total bookings: ${pagination.total}`);

  // Process bookings array
  bookings.forEach((booking) => {
    console.log(`Order ${booking.order_id}: ${booking.status}`);
    console.log(`Room: ${booking.room.name} at ${booking.room.property.name}`);
    console.log(`Dates: ${booking.check_in_date} to ${booking.check_out_date}`);
  });
} else {
  console.error('Error:', message);
}
```

### Error Handling

```javascript
try {
  const bookings = await fetchMyBookings();
} catch (error) {
  if (error.response?.status === 401) {
    // Token expired or invalid - redirect to login
    window.location.href = '/login';
  } else if (error.response?.status === 400) {
    // Invalid parameters
    console.error('Invalid request:', error.response.data.message);
  } else {
    // Other errors
    console.error('API Error:', error.message);
  }
}
```

### State Management (React Example)

```javascript
import { useState, useEffect } from 'react';

const useMyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBookings = async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchMyBookings(params);
      if (response.success) {
        setBookings(response.data.data);
        setTotalCompleted(response.data.total_completed);
        setPagination(response.data.pagination);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return {
    bookings,
    totalCompleted,
    pagination,
    loading,
    error,
    refetch: fetchBookings,
  };
};
```

## Notes

- All dates in responses are normalized to Asia/Jakarta timezone (UTC+7)
- The endpoint automatically uses the authenticated user's ID from JWT token
- Pagination starts from page 1
- Default sorting is by creation date (newest first)
- Status values: pending_payment, processing, confirmed, cancelled, completed
