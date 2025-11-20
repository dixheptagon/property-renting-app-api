# Login API Documentation

## Endpoint

```
POST /api/auth/login
```

## Description

Authenticates a user by verifying their email and password. Upon successful login, generates and returns an access token, and sets a refresh token in an HTTP-only cookie.

## Request Body

```json
{
  "email": "user@example.com",
  "password": "userpassword"
}
```

### Parameters

- `email` (string, required): The user's email address. Must be a valid email format.
- `password` (string, required): The user's password.

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "uid": "user-uid",
      "email": "user@example.com",
      "is_verified": true,
      "first_name": "John",
      "last_name": "Doe",
      "display_name": "johndoe",
      "role": "guest",
      "image": null,
      "created_at": "2023-01-01T00:00:00.000Z",
      "updated_at": null,
      "deleted_at": null
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Error Response (401 Unauthorized)

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

## Cookies

- `refresh_token`: HTTP-only cookie containing the refresh token. Valid for 7 days.
  - `httpOnly`: true
  - `secure`: true in production, false in development
  - `sameSite`: "strict"
  - `path`: "/"
  - `maxAge`: 604800000 (7 days in milliseconds)

## Authentication Details

- **Access Token**: JWT token valid for 15 minutes, containing user UID, email, and role.
- **Refresh Token**: JWT token valid for 7 days, stored in database and HTTP-only cookie.

## Error Handling

- Uses `CustomError` for consistent error responses.
- Invalid email or password returns 401 status.
- Password comparison uses bcrypt for security.
- OAuth users (without password) cannot login via this endpoint.

## Dependencies

- `bcrypt`: For password hashing and comparison.
- `jsonwebtoken`: For JWT token generation.
- `prisma`: For database operations.
- `yup`: For request validation.

## Security Features

- Passwords are hashed and compared securely.
- Tokens are signed with environment-specific secrets.
- Refresh tokens are stored securely in HTTP-only cookies.
- User data excludes sensitive information (password, refresh_token) in responses.
