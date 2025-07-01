# Multi-User Authentication Fix Guide

## Overview
This guide explains the implementation of multi-user authentication support in the Pipedrive extension frontend. The backend requires a `userId` parameter to authenticate individual users, and this implementation ensures that parameter is included in all API calls.

## Problem
The backend was returning 401 errors with the message "No user ID provided, authentication required" because the frontend wasn't sending the required `userId` parameter in API calls.

## Solution Architecture

### 1. User Authentication Data Management (`app/utils/userAuth.ts`)
A utility module that handles:
- Capturing user data from URL parameters after OAuth redirect
- Storing user data in localStorage for persistence
- Adding user data to API requests (URL params, headers, or body)
- Preventing duplicate parameters in URLs

Key functions:
- `captureUserAuthFromURL()` - Captures userId, companyId, userEmail from URL
- `storeUserAuth()` - Persists data to localStorage
- `getUserAuth()` - Retrieves data from localStorage
- `appendUserAuthToUrl()` - Adds user data as query parameters (only if not already present)
- `addUserAuthHeaders()` - Adds user data as HTTP headers
- `addUserAuthToBody()` - Adds user data to request body

### 2. Authentication Retry Management (`app/utils/authRetry.ts`)
Handles failed API calls that require authentication:
- Stores pending actions when API calls fail with 401
- Automatically retries actions after successful authentication
- Prevents redirect loops to API endpoints

Key functions:
- `storePendingAction()` - Saves the failed API call details
- `getPendingAction()` - Retrieves pending action (with expiry check)
- `executePendingAction()` - Retries the stored action
- `clearPendingAction()` - Clears stored action

### 3. User Authentication Hook (`app/hooks/useUserAuth.ts`)
React hook for managing authentication state:
- Provides easy access to user auth data in components
- Handles loading states
- Checks authentication status

### 4. Updated API Client (`app/utils/apiClient.ts`)
The API client now automatically includes user authentication data in all requests:
- GET requests: Only `userId` and `companyId` added as URL query parameters (if not already present)
- POST/PUT requests: User auth data added to request body
- All requests: User data added as HTTP headers (X-User-ID, X-Company-ID, X-User-Email)
- Prevents duplicate parameters by checking existing URL parameters first

### 5. Updated Success Page (`app/auth/pipedrive/success/page.tsx`)
- Captures authentication data from URL parameters when users are redirected after successful OAuth
- Automatically executes any pending actions that failed due to authentication
- Shows progress indicator when processing pending actions

### 6. Updated Backend API Routes
All Next.js API route handlers now forward userId to the backend:
- `app/api/pipedrive/data/route.ts`
- `app/api/pipedrive/create-project/route.ts`
- `app/api/project/create-full/route.ts`

### 7. Updated Frontend Pages
All pages now capture user authentication data on load:
- `app/pipedrive-data-view/page.tsx`
- `app/create-project-page/page.tsx`
- `app/update-quotation-page/page.tsx`
- `app/create-invoice-page/page.tsx`

## OAuth Flow

1. User initiates OAuth connection or makes API call without authentication
2. If API call returns 401, the pending action is stored and user is redirected to auth
3. After successful authentication, backend redirects to frontend success page with URL parameters:
   ```
   http://localhost:3001/auth/pipedrive/success?authSuccess=true&companyId=14002541&userId=23727547&userEmail=admin@example.com
   ```
4. Success page captures these parameters and stores them in localStorage
5. If there was a pending action, it's automatically retried
6. All subsequent API calls include the userId

### Authentication Retry Flow

When an API call fails with 401:
1. The `apiCall` function stores the pending action (URL, method, body, headers)
2. User is redirected to authentication
3. After successful auth, the success page executes the pending action
4. No manual retry needed - it's automatic!

## API Call Examples

### Example: Creating a Xero Quote
```javascript
// In your component (e.g., pipedrive-data-view)
const handleCreateQuote = async () => {
  try {
    // The apiCall function will automatically include userId from localStorage
    const response = await apiCall('/api/xero/quote', {
      method: 'POST',
      body: JSON.stringify({
        pipedriveDealId: '8',
        pipedriveCompanyId: '14002541'
        // userId is automatically added by apiCall!
      })
    });
    
    // If user is not authenticated:
    // 1. This call will get 401
    // 2. The pending action is automatically stored
    // 3. User is redirected to auth
    // 4. After auth, the action is automatically retried
    // 5. Success!
    
  } catch (error) {
    // Only handle non-auth errors here
    console.error('Error:', error);
  }
};
```

### GET Request
```javascript
// Before
fetch('/api/pipedrive/data?dealId=8&companyId=14002541')

// After (automatically handled by apiCall)
fetch('/api/pipedrive/data?dealId=8&companyId=14002541&userId=23727547')
```

**Note**: The frontend calls `/api/pipedrive/data` (Next.js API route), which forwards to `/api/pipedrive-data` on your Node.js backend.

### POST Request
```javascript
// Before
fetch('/api/xero/quote', {
  method: 'POST',
  body: JSON.stringify({ dealId: '8', companyId: '14002541' })
})

// After (automatically handled by apiCall)
fetch('/api/xero/quote?userId=23727547&companyId=14002541&userEmail=admin@example.com', {
  method: 'POST',
  headers: {
    'X-User-ID': '23727547',
    'X-Company-ID': '14002541',
    'X-User-Email': 'admin@example.com'
  },
  body: JSON.stringify({ 
    dealId: '8', 
    companyId: '14002541',
    userId: '23727547',
    userEmail: 'admin@example.com'
  })
})
```

## Testing

1. Clear localStorage to test fresh authentication:
   ```javascript
   localStorage.removeItem('pipedrive_user_auth')
   ```

2. Navigate to any protected page to trigger authentication

3. After OAuth redirect, verify user data is captured:
   ```javascript
   // In browser console
   const authData = JSON.parse(localStorage.getItem('pipedrive_user_auth'))
   console.log(authData)
   ```

4. Check network tab to verify userId is included in API calls

## Troubleshooting

### User not authenticated
- Check if userId is present in localStorage
- Verify OAuth redirect includes all required parameters
- Check browser console for error messages

### Duplicate Parameters in URL
If you see duplicate `companyId` or other parameters in the URL:
- The `appendUserAuthToUrl` function now checks for existing parameters before adding them
- Clear your localStorage and try again: `localStorage.removeItem('pipedrive_user_auth')`

### Wrong API Endpoint
- Frontend should call Next.js API routes (e.g., `/api/pipedrive/data`)
- Next.js API routes forward to your Node.js backend (e.g., `/api/pipedrive-data`)
- Check the `EXTERNAL_API_ENDPOINTS` constants match your backend routes

### API calls still failing
- Verify backend is expecting userId in the correct format (query param vs header vs body)
- Check if backend requires additional authentication headers
- Ensure localStorage isn't blocked by browser settings
- For the pipedrive-data endpoint, only `dealId`, `companyId`, and `userId` are needed in query params

### Clearing user data
To force re-authentication:
```javascript
import { clearUserAuth } from './utils/userAuth';
clearUserAuth();
```

## Security Considerations

1. User data is stored in localStorage (not secure for sensitive data)
2. Consider implementing token-based authentication for production
3. Add expiration to stored user data
4. Validate user data on backend for each request

## Next Steps

1. Implement token refresh mechanism
2. Add user data expiration
3. Handle multi-account switching
4. Add logout functionality
5. Consider using secure httpOnly cookies instead of localStorage 