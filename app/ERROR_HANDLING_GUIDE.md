# Error Handling Guide

This guide explains how to implement the new error handling system across the application.

## Components Available

### 1. ApiErrorPage Component
A beautiful, user-friendly error page that displays:
- Contextual error icons and titles based on HTTP status codes
- Clear error messages and descriptions
- Action buttons (Try Again, Go Home, Contact Support)
- Error details and status codes

### 2. Global Error Boundary
Located at `/app/error.tsx`, catches unhandled errors at the app level.

### 3. Enhanced API Client
The `apiClient.ts` now includes status codes in error objects for better error handling.

## Implementation Guide

### Step 1: Update Your Data Fetching Hooks

Update your hooks to return error details with status codes:

```typescript
// Before
const [error, setError] = useState<string | null>(null);

// After
const [error, setError] = useState<string | null>(null);
const [errorDetails, setErrorDetails] = useState<{ statusCode?: number; details?: string } | null>(null);

// In your catch block:
catch (e: any) {
  setError(e.message || 'Failed to fetch data');
  setErrorDetails({
    statusCode: e.statusCode || e.response?.status,
    details: e.response?.data?.details
  });
}

// Return both in your hook
return { data, loading, error, errorDetails, refetch };
```

### Step 2: Use ApiErrorPage in Your Components

```typescript
import ApiErrorPage from '../components/ApiErrorPage';

// In your component
if (error) {
  // For API errors with status codes
  if (errorDetails?.statusCode) {
    return (
      <ApiErrorPage
        error={{
          message: error,
          statusCode: errorDetails.statusCode,
          details: errorDetails.details
        }}
        onRetry={() => refetch()}
      />
    );
  }
  
  // For other errors, use standard ErrorDisplay
  return <ErrorDisplay error={error} onRetry={() => refetch()} />;
}
```

### Step 3: Use the Simplified Hook (Recommended)

For easier implementation, use the `useApiWithErrorPage` hook:

```typescript
import { useApiWithErrorPage } from '../hooks/useApiWithErrorPage';

function YourComponent() {
  const { data, loading, error, errorDetails, refetch } = useYourDataHook();
  
  // Handle loading and error states automatically
  const errorState = useApiWithErrorPage({
    loading,
    error,
    errorDetails,
    onRetry: refetch,
  });

  if (errorState.shouldRender) {
    return errorState.component;
  }

  // Your normal component rendering
  return <div>Your content here</div>;
}
```

## Error Types and Display

The ApiErrorPage automatically handles different error types:

- **400 Bad Request**: Shows validation icon (⚠️) with "Bad Request" title
- **401 Unauthorized**: Shows lock icon (🔒) with "Authentication Required" title
- **403 Forbidden**: Shows stop icon (🚫) with "Access Denied" title
- **404 Not Found**: Shows search icon (🔍) with "Not Found" title
- **500+ Server Errors**: Shows fire icon (🔥) with "Server Error" title

## Examples

### Example 1: Create Project Page
```typescript
if (typeof errorMessage === 'string' && errorMessage.includes('Deal validation failed')) {
  return (
    <ApiErrorPage
      error={{
        title: 'Project Creation Failed',
        message: errorMessage,
        statusCode: 400,
        details: 'Please ensure the deal has both a quote number and quote ID.'
      }}
      onRetry={() => refetch()}
    />
  );
}
```

### Example 2: Data Fetching Page
```typescript
const { data, loading, error, errorDetails, refetch } = usePipedriveData(dealId, companyId);

if (error && errorDetails?.statusCode) {
  return (
    <ApiErrorPage
      error={{
        message: error,
        statusCode: errorDetails.statusCode,
        details: dealId ? `Deal ID: ${dealId}` : undefined
      }}
      onRetry={() => refetch()}
    />
  );
}
```

## Best Practices

1. **Always include retry functionality** - Pass the refetch function to onRetry
2. **Provide context** - Include relevant IDs or details in the error details
3. **Use appropriate status codes** - Let the API client handle status code extraction
4. **Graceful degradation** - Fall back to ErrorDisplay for non-API errors
5. **Test error states** - Visit `/demo/error-page` to see all error types

## Migration Checklist

When updating a page to use the new error handling:

- [ ] Update data fetching hook to return errorDetails
- [ ] Import ApiErrorPage component
- [ ] Replace error rendering with ApiErrorPage for API errors
- [ ] Ensure refetch function is passed to onRetry
- [ ] Test error states by simulating API failures

## Demo

Visit http://localhost:3001/demo/error-page to see all error types in action.