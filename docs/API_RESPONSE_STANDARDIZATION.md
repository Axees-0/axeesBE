# API Response Standardization Documentation

## Overview

This document describes the standardized API response format implemented across all controllers in the Axees platform. The standardization ensures consistency, improves error handling, and provides a predictable interface for frontend applications.

## Response Format

### Success Response Structure
```javascript
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* optional data object */ },
  // Additional fields can be spread at the root level
}
```

### Error Response Structure
```javascript
{
  "success": false,
  "message": "Error description",
  "error": { /* optional error details */ }
}
```

## Implementation

### Response Helper Utility

The response standardization is implemented through a centralized utility located at:
`/utils/responseHelper.js`

This utility exports three main functions:

#### 1. `successResponse(res, message, data, statusCode)`
- **Purpose**: Send standardized success responses
- **Parameters**:
  - `res`: Express response object
  - `message`: Success message string
  - `data`: Optional data object (default: null)
  - `statusCode`: HTTP status code (default: 200)

#### 2. `errorResponse(res, message, statusCode, data)`
- **Purpose**: Send standardized error responses
- **Parameters**:
  - `res`: Express response object
  - `message`: Error message string
  - `statusCode`: HTTP status code (default: 400)
  - `data`: Optional additional error data

#### 3. `handleServerError(res, error, operation)`
- **Purpose**: Handle and format server errors consistently
- **Parameters**:
  - `res`: Express response object
  - `error`: Error object
  - `operation`: Description of the operation that failed

## Usage Examples

### Success Response
```javascript
// Simple success
return successResponse(res, "User created successfully");

// Success with data
return successResponse(res, "Login successful", {
  token: jwtToken,
  user: userData
});

// Success with custom status code
return successResponse(res, "Resource created", { id: resourceId }, 201);
```

### Error Response
```javascript
// Simple error
return errorResponse(res, "Invalid credentials", 401);

// Error with additional data
return errorResponse(res, "Validation failed", 400, {
  fields: ['email', 'phone']
});
```

### Server Error Handling
```javascript
try {
  // ... operation code
} catch (error) {
  handleServerError(res, error, "user registration");
}
```

## Controllers Updated

The following controllers have been updated to use the standardized response format:

1. **accountController.js**
   - All authentication endpoints (login, register, OTP verification)
   - Profile management endpoints
   - Password reset flow

2. **paymentController.js**
   - Payment intent creation
   - Transaction history
   - Webhook handling

3. **Other Controllers** (pending implementation)
   - Deal execution controllers
   - Offer management controllers
   - Chat messaging controllers

## Migration Guide

When updating existing endpoints:

1. Import the response helper functions:
   ```javascript
   const { successResponse, errorResponse, handleServerError } = require('../utils/responseHelper');
   ```

2. Replace direct `res.status().json()` calls:
   ```javascript
   // Before
   res.status(200).json({ message: "Success", data: result });
   
   // After
   successResponse(res, "Success", { data: result });
   ```

3. Update error handling:
   ```javascript
   // Before
   res.status(400).json({ error: "Bad request" });
   
   // After
   errorResponse(res, "Bad request", 400);
   ```

## Testing Considerations

All tests expect responses to include the `success` boolean field. When writing new tests:

```javascript
expect(response.body.success).toBe(true);
expect(response.body.message).toContain('expected message');
```

## Benefits

1. **Consistency**: All API responses follow the same structure
2. **Error Handling**: Centralized error formatting and logging
3. **Frontend Integration**: Predictable response format simplifies client-side code
4. **Maintainability**: Changes to response format can be made in one place
5. **Testing**: Easier to write and maintain tests with consistent expectations

## Future Enhancements

1. Add request ID tracking for better debugging
2. Implement response compression for large payloads
3. Add response time metrics
4. Consider implementing response caching headers