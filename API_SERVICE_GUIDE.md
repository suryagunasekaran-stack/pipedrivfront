# 🚀 API Service Layer Implementation

This document explains how to use the new comprehensive API service layer that has been implemented according to the Frontend Integration Guide.

## 📋 Overview

The API service layer provides:
- ✅ Centralized API communication
- ✅ Comprehensive error handling with custom error types
- ✅ Automatic retry logic with exponential backoff
- ✅ TypeScript interfaces for all API responses
- ✅ Authentication state management with Zustand
- ✅ Protected routes for authentication
- ✅ Error boundary for graceful error handling

## 🔧 Core Components

### 1. API Service (`app/services/api.ts`)

The main API service class with all backend endpoints:

```typescript
import { apiService } from '../services/api';

// Check authentication status
const authStatus = await apiService.checkAuthStatus(companyId);

// Get Pipedrive data
const dealData = await apiService.getPipedriveData(companyId, dealId);

// Create Xero quote
const quote = await apiService.createQuote({
  pipedriveCompanyId: companyId,
  pipedriveDealId: dealId
});

// Create project
const project = await apiService.createProject({
  pipedriveCompanyId: companyId,
  pipedriveDealId: dealId,
  existingProjectNumberToLink: projectNumber // optional
});
```

### 2. Error Handling (`app/utils/errors.ts`)

Custom error classes for different error types:

```typescript
import { ApiError, getUserFriendlyErrorMessage } from '../utils/errors';

try {
  const data = await apiService.getPipedriveData(companyId, dealId);
} catch (error) {
  if (error instanceof ApiError) {
    const userMessage = getUserFriendlyErrorMessage(error);
    // Show user-friendly message to user
    console.log('User message:', userMessage);
    console.log('Technical details:', error.details);
  }
}
```

### 3. Type Definitions (`app/types/api.ts`)

Comprehensive TypeScript interfaces:

```typescript
import type { 
  PipedriveDataResponse, 
  CreateQuoteResponse,
  AuthStatusResponse 
} from '../types/api';

// All API responses are fully typed
const dealData: PipedriveDataResponse = await apiService.getPipedriveData(companyId, dealId);
const authStatus: AuthStatusResponse = await apiService.checkAuthStatus(companyId);
```

### 4. Authentication Store (`app/store/authStore.ts`)

Centralized authentication state management:

```typescript
import { useAuthStore, usePipedriveAuth, useXeroAuth } from '../store/authStore';

// In your component
const { isAuthenticated, checkAuthStatus } = useAuthStore();
const { isConnected: pipedriveConnected } = usePipedriveAuth();
const { isConnected: xeroConnected, requiresConnection } = useXeroAuth();

// Check auth status
await checkAuthStatus(companyId);
```

### 5. Protected Routes (`app/components/ProtectedRoute.tsx`)

Route protection for authenticated pages:

```typescript
import { ProtectedRoute } from '../components/ProtectedRoute';

// Protect a page component
export default function MyProtectedPage() {
  return (
    <ProtectedRoute requireXero={true} companyId={companyId}>
      <div>Your protected content here</div>
    </ProtectedRoute>
  );
}

// Or use as HOC
import { withProtectedRoute } from '../components/ProtectedRoute';

const MyPage = () => <div>Protected content</div>;
export default withProtectedRoute(MyPage, { requireXero: true });
```

### 6. Error Boundary (`app/components/ErrorBoundary.tsx`)

Catch and handle React errors gracefully:

```typescript
import ErrorBoundary from '../components/ErrorBoundary';

export default function MyApp() {
  return (
    <ErrorBoundary onError={(error, errorInfo) => console.log('Error:', error)}>
      <YourAppContent />
    </ErrorBoundary>
  );
}
```

## 🎯 Migration from Old API Client

The old `apiClient.ts` has been updated to use the new service layer while maintaining backward compatibility. However, you should migrate to the new API:

### Before (Deprecated):
```typescript
import { api } from '../utils/apiClient';

const data = await api.getPipedriveData(dealId, companyId);
```

### After (Recommended):
```typescript
import { apiService } from '../services/api';

const data = await apiService.getPipedriveData(companyId, dealId);
```

## 🚀 Quick Start Example

Here's a complete example of using the new API service in a component:

```typescript
'use client';

import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { ProtectedRoute } from '../components/ProtectedRoute';
import ErrorBoundary from '../components/ErrorBoundary';
import type { PipedriveDataResponse } from '../types/api';

function DealViewPage({ companyId, dealId }: { companyId: string; dealId: string }) {
  const [dealData, setDealData] = useState<PipedriveDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const authStore = useAuthStore();

  useEffect(() => {
    const loadDealData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Ensure authentication
        await authStore.checkAuthStatus(companyId);
        
        // Load deal data
        const data = await apiService.getPipedriveData(companyId, dealId);
        setDealData(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load deal data');
      } finally {
        setLoading(false);
      }
    };

    loadDealData();
  }, [companyId, dealId]);

  const handleCreateQuote = async () => {
    try {
      const quote = await apiService.createQuote({
        pipedriveCompanyId: companyId,
        pipedriveDealId: dealId
      });
      
      alert(`Quote ${quote.quoteNumber} created successfully!`);
      
      // Reload data to show updated information
      const updatedData = await apiService.getPipedriveData(companyId, dealId);
      setDealData(updatedData);
    } catch (err: any) {
      alert(`Failed to create quote: ${err.message}`);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!dealData) return <div>No data found</div>;

  return (
    <div>
      <h1>{dealData.deal.title}</h1>
      <p>Value: {dealData.deal.currency} {dealData.deal.value}</p>
      
      <button onClick={handleCreateQuote}>
        Create Xero Quote
      </button>
    </div>
  );
}

// Export with protection and error boundary
export default function DealViewPageWrapper(props: { companyId: string; dealId: string }) {
  return (
    <ErrorBoundary>
      <ProtectedRoute requireXero={true} companyId={props.companyId}>
        <DealViewPage {...props} />
      </ProtectedRoute>
    </ErrorBoundary>
  );
}
```

## ⚙️ Configuration

The API service uses environment variables from `.env.local`:

```bash
# Required
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_FRONTEND_BASE_URL=http://localhost:3001

# Optional
NEXT_PUBLIC_DEBUG_MODE=true
```

## 🔍 Error Types

The system recognizes these error types:

- `NETWORK_ERROR` - Connection issues
- `TIMEOUT_ERROR` - Request timeouts
- `AUTH_ERROR` - Authentication required
- `VALIDATION_ERROR` - Input validation failed
- `SERVER_ERROR` - Backend server errors
- `UNKNOWN_ERROR` - Unexpected errors

## 🧪 Testing

The error handling and retry logic can be tested by temporarily changing API URLs or network conditions. The service will automatically retry failed requests and provide appropriate error messages.

## 📊 Benefits

✅ **Type Safety**: Full TypeScript support with comprehensive interfaces
✅ **Error Handling**: Custom error types with user-friendly messages
✅ **Retry Logic**: Automatic retries with exponential backoff
✅ **Authentication**: Centralized auth state management
✅ **Route Protection**: Easy-to-use protected route components
✅ **Error Recovery**: Error boundaries for graceful error handling
✅ **Performance**: Optimized with caching and request cancellation
✅ **Developer Experience**: Clear APIs with excellent TypeScript IntelliSense

This implementation fully addresses **Issue #1** from the integration guide analysis and provides a solid foundation for the remaining features.
