/**
 * Custom API Error Classes and Error Handling Utilities
 * Implements comprehensive error handling as specified in the Frontend Integration Guide
 */

import { ApiErrorType, API_ERRORS } from '../types/api';

// =============================================================================
// CUSTOM ERROR CLASSES
// =============================================================================

export class ApiError extends Error {
  statusCode: number;
  requestId?: string;
  details?: any;
  type: ApiErrorType;
  
  constructor(
    message: string, 
    statusCode: number = 500, 
    type: ApiErrorType = API_ERRORS.UNKNOWN_ERROR,
    requestId?: string, 
    details?: any
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.type = type;
    this.requestId = requestId;
    this.details = details;
    
    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

export class NetworkError extends ApiError {
  constructor(message: string = 'Network request failed', details?: any) {
    super(message, 0, API_ERRORS.NETWORK_ERROR, undefined, details);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends ApiError {
  constructor(message: string = 'Request timed out', timeout: number = 0) {
    super(message, 408, API_ERRORS.TIMEOUT_ERROR, undefined, { timeout });
    this.name = 'TimeoutError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required', details?: any) {
    super(message, 401, API_ERRORS.AUTH_ERROR, undefined, details);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(message, 400, API_ERRORS.VALIDATION_ERROR, undefined, details);
    this.name = 'ValidationError';
  }
}

// =============================================================================
// ERROR HANDLING UTILITIES
// =============================================================================

/**
 * Handles API error responses and converts them to appropriate error types
 */
export async function handleApiError(response: Response): Promise<never> {
  const contentType = response.headers.get('content-type');
  
  let errorData: any = {};
  
  try {
    if (contentType && contentType.includes('application/json')) {
      errorData = await response.json();
    } else {
      errorData = { error: await response.text() };
    }
  } catch (parseError) {
    errorData = { error: 'Failed to parse error response' };
  }
  
  const message = errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
  const requestId = errorData.requestId || response.headers.get('x-request-id');
  
  // Determine error type based on status code
  let errorType: ApiErrorType;
  switch (response.status) {
    case 400:
      errorType = API_ERRORS.VALIDATION_ERROR;
      break;
    case 401:
    case 403:
      errorType = API_ERRORS.AUTH_ERROR;
      break;
    case 408:
      errorType = API_ERRORS.TIMEOUT_ERROR;
      break;
    case 500:
    case 502:
    case 503:
    case 504:
      errorType = API_ERRORS.SERVER_ERROR;
      break;
    default:
      errorType = API_ERRORS.UNKNOWN_ERROR;
  }
  
  throw new ApiError(
    message,
    response.status,
    errorType,
    requestId,
    errorData.details
  );
}

/**
 * Handles network and other non-HTTP errors
 */
export function handleNetworkError(error: any): never {
  if (error.name === 'AbortError') {
    throw new TimeoutError('Request was aborted');
  }
  
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    throw new NetworkError('Network connection failed', error);
  }
  
  // If it's already one of our custom errors, re-throw it
  if (error instanceof ApiError) {
    throw error;
  }
  
  // Unknown error
  throw new ApiError(
    error.message || 'Unknown error occurred',
    500,
    API_ERRORS.UNKNOWN_ERROR,
    undefined,
    error
  );
}

/**
 * Logs errors appropriately based on environment
 */
export function logError(error: ApiError, context?: string): void {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const debugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';
  
  if (isDevelopment || debugMode) {
    console.group(`🚨 API Error${context ? ` - ${context}` : ''}`);
    console.error('Message:', error.message);
    console.error('Status Code:', error.statusCode);
    console.error('Type:', error.type);
    console.error('Request ID:', error.requestId);
    console.error('Details:', error.details);
    console.error('Stack:', error.stack);
    console.groupEnd();
  }
  
  // In production, you might want to send errors to a monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to error tracking service
    // errorTracking.captureException(error, { extra: { context } });
  }
}

/**
 * Creates a user-friendly error message from an API error
 */
export function getUserFriendlyErrorMessage(error: ApiError): string {
  switch (error.type) {
    case API_ERRORS.NETWORK_ERROR:
      return 'Unable to connect to the server. Please check your internet connection and try again.';
      
    case API_ERRORS.TIMEOUT_ERROR:
      return 'The request took too long to complete. Please try again.';
      
    case API_ERRORS.AUTH_ERROR:
      return 'Authentication is required. Please log in and try again.';
      
    case API_ERRORS.VALIDATION_ERROR:
      return error.message || 'Please check your input and try again.';
      
    case API_ERRORS.SERVER_ERROR:
      return 'A server error occurred. Please try again later.';
      
    default:
      return error.message || 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Determines if an error is retryable
 */
export function isRetryableError(error: ApiError): boolean {
  const retryableTypes: ApiErrorType[] = [
    API_ERRORS.NETWORK_ERROR,
    API_ERRORS.TIMEOUT_ERROR,
    API_ERRORS.SERVER_ERROR
  ];
  
  return retryableTypes.includes(error.type);
}

/**
 * Calculates retry delay with exponential backoff
 */
export function calculateRetryDelay(attempt: number, baseDelay: number = 1000): number {
  return Math.min(baseDelay * Math.pow(2, attempt), 30000); // Max 30 seconds
}
