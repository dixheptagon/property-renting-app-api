# verifyToken Middleware

## Overview

The `verifyToken` middleware is a custom Express.js middleware function designed to authenticate and verify JWT (JSON Web Token) access tokens in protected routes. It ensures that only authenticated users can access certain endpoints by validating the token provided in the `Authorization` header.

## Requirements

- **Token Format**: The access token must be sent in the `Authorization` header with the format `Bearer <token>`.
- **Verification**: Uses the `jsonwebtoken` package to verify the token against the secret stored in `process.env.JWT_ACCESS_SECRET`.
- **Payload Attachment**: If the token is valid, the decoded payload (containing fields like `uid`, `email`, `role`, etc.) is attached to `req.user`.
- **Error Handling**:
  - If the token is missing, returns a **401 Unauthorized** response with the message `"Access token is required"`.
  - If the token is invalid or expired, returns a **401 Unauthorized** response with the message `"Invalid or expired token"`.
- **Reusability**: The middleware is designed to be reusable across any protected route, e.g., `router.get('/profile', verifyToken, handler)`.

## Usage

### Importing the Middleware

```typescript
import verifyToken from './src/lib/middlewares/verify.token';
```

### Applying to Routes

```typescript
import express from 'express';
import verifyToken from './src/lib/middlewares/verify.token';

const router = express.Router();

// Example protected route
router.get('/profile', verifyToken, (req, res) => {
  // Access user data from req.user
  const user = req.user;
  res.json({ message: 'Profile data', user });
});

export default router;
```

## Implementation Details

### Type Definitions

- **JwtPayload Interface**: Defines the structure of the decoded JWT payload.

  ```typescript
  interface JwtPayload {
    uid: string;
    email: string;
    role: string;
    // Add other fields as needed
  }
  ```

- **Express Request Extension**: Extends the Express `Request` interface to include an optional `user` property.
  ```typescript
  declare global {
    namespace Express {
      interface Request {
        user?: JwtPayload;
      }
    }
  }
  ```

### Middleware Function

The `verifyToken` function performs the following steps:

1. **Extract Authorization Header**: Retrieves the `Authorization` header from the request.
2. **Validate Header Presence**: Checks if the header exists and starts with `'Bearer '`.
3. **Extract Token**: Removes the `'Bearer '` prefix to get the actual token.
4. **Verify Token**: Uses `jwt.verify()` to validate the token against the secret.
5. **Attach Payload**: If valid, attaches the decoded payload to `req.user`.
6. **Handle Errors**: Catches verification errors and returns appropriate 401 responses.

### Error Responses

- **Missing Token**:

  ```json
  {
    "success": false,
    "message": "Access token is required"
  }
  ```

- **Invalid or Expired Token**:
  ```json
  {
    "success": false,
    "message": "Invalid or expired token"
  }
  ```

## Dependencies

- `express`: For the `RequestHandler` type and middleware functionality.
- `jsonwebtoken`: For token verification.
- `../env`: For accessing the `JWT_ACCESS_SECRET` configuration.

## Best Practices

- **Security**: Ensure the `JWT_ACCESS_SECRET` is kept secure and not exposed in version control.
- **Error Handling**: The middleware handles common JWT errors (invalid signature, expired token) gracefully.
- **Type Safety**: Uses TypeScript interfaces for type safety and better developer experience.
- **Reusability**: Designed as a pure middleware function that can be easily applied to multiple routes.

## Example Token Payload

A typical decoded JWT payload might look like:

```json
{
  "uid": "user123",
  "email": "user@example.com",
  "role": "user",
  "iat": 1638360000,
  "exp": 1638363600
}
```

This payload is attached to `req.user` for use in subsequent middleware or route handlers.
