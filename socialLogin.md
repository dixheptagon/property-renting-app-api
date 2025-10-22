# Social Login API Documentation

## Endpoint

```
POST /api/auth/social-login
```

## Description

Authenticates a user using Firebase social login (e.g., Google). Verifies the provided ID token, checks if the user exists in the database, creates a new user if necessary, and returns access and refresh tokens.

## Request Body

```json
{
  "idToken": "firebase_id_token_here"
}
```

### Parameters

- `idToken` (string, required): The Firebase ID token obtained from the client-side authentication.

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Social login successful",
  "data": {
    "access_token": "jwt_access_token_here",
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
    }
  }
}
```

### Error Response (400 Bad Request)

```json
{
  "success": false,
  "message": "Bad Request",
  "error": "idToken is required"
}
```

### Error Response (500 Internal Server Error)

```json
{
  "success": false,
  "message": "Internal Server Error",
  "error": "An error occurred during social login"
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

## Process Flow

1. **Token Verification**: The ID token is verified using Firebase Admin SDK.
2. **User Lookup**: The system checks if a user with the provided UID exists in the database.
3. **User Creation**: If the user does not exist, a new user is created with the extracted information (uid, email, name, picture) and provider set to "google". A UserProvider record is also created.
4. **Token Generation**: Access and refresh tokens are generated using JWT.
5. **Token Storage**: The refresh token is stored in the database and set as an HTTP-only cookie.
6. **Response**: The access token and user information are returned in the response.

## Error Handling

- Uses `CustomError` for consistent error responses.
- Returns 400 for missing or invalid ID tokens.
- Returns 500 for internal server errors during token verification or database operations.

## Dependencies

- `firebase-admin`: For Firebase token verification.
- `jsonwebtoken`: For JWT token generation.
- `prisma`: For database operations.

## Security Features

- Firebase ID tokens are verified server-side to ensure authenticity.
- JWT tokens are signed with environment-specific secrets.
- Refresh tokens are stored securely in HTTP-only cookies.
- User data in responses excludes sensitive information.

## Database Changes

- If a new user is created, records are added to both `User` and `UserProvider` tables.
- The user's `refresh_token` field is updated with the new refresh token.
