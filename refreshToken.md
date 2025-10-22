# Refresh Token API Documentation

## Endpoint

```
POST /api/auth/refresh-token
```

## Description

Refreshes an access token using a valid refresh token stored in an HTTP-only cookie. This endpoint verifies the refresh token, checks it against the database, and generates a new access token if valid.

## Request

### Method

POST

### Headers

- No specific headers required (refresh token is read from cookie)

### Cookies

- `refresh_token` (required): HTTP-only cookie containing the refresh token.

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Access token refreshed successfully",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Error Response (401 Unauthorized)

```json
{
  "success": false,
  "message": "Unauthorized",
  "error": "Refresh token is required"
}
```

or

```json
{
  "success": false,
  "message": "Unauthorized",
  "error": "Invalid or expired refresh token"
}
```

or

```json
{
  "success": false,
  "message": "Unauthorized",
  "error": "Invalid refresh token"
}
```

## Process Flow

1. **Read Refresh Token**: Extracts the refresh token from the `refresh_token` HTTP-only cookie.
2. **Verify Token**: Verifies the refresh token using `jsonwebtoken` with `process.env.JWT_REFRESH_SECRET`.
3. **Database Check**: Ensures the refresh token matches the one stored in the database for the user.
4. **Generate New Tokens**: Creates a new access token (valid for 15 minutes) and a new refresh token (valid for 7 days) with user payload (uid, email, role).
5. **Update Database and Cookie**: Stores the new refresh token in the database and sets it in an HTTP-only cookie.
6. **Response**: Returns the new access token in JSON format.

## Authentication Details

- **Refresh Token**: JWT token valid for 7 days, stored in HTTP-only cookie and database.
- **Access Token**: JWT token valid for 15 minutes, containing user UID, email, and role.

## Error Handling

- Uses `CustomError` for consistent error responses.
- Handles JWT verification errors (invalid/expired tokens).
- Checks token existence in database to prevent token reuse.
- All errors result in 401 Unauthorized status.

## Dependencies

- `jsonwebtoken`: For JWT token verification and generation.
- `prisma`: For database operations to validate refresh token.
- `express`: For request/response handling.

## Security Features

- Refresh tokens are stored in HTTP-only cookies to prevent XSS attacks.
- Tokens are verified against database to ensure validity.
- New access tokens are signed with environment-specific secrets.
- User payload includes essential information (uid, email, role) without sensitive data.
