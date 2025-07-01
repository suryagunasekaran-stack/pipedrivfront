/**
 * User authentication utilities for managing userId, companyId, and userEmail
 * These are required for multi-user authentication with the backend
 */

export interface UserAuthData {
  userId: string;
  companyId: string;
  userEmail: string;
  userName?: string;
}

const USER_AUTH_KEY = 'pipedrive_user_auth';

/**
 * Capture user auth data from URL parameters
 * This is typically called after OAuth redirect
 */
export function captureUserAuthFromURL(): UserAuthData | null {
  if (typeof window === 'undefined') return null;
  
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('userId');
  const companyId = params.get('companyId');
  const userEmail = params.get('userEmail');
  const userName = params.get('userName');
  
  if (userId && companyId && userEmail) {
    const authData: UserAuthData = {
      userId,
      companyId,
      userEmail,
      userName: userName || undefined
    };
    
    // Store in localStorage for persistence
    storeUserAuth(authData);
    
    return authData;
  }
  
  return null;
}

/**
 * Store user auth data in localStorage
 */
export function storeUserAuth(authData: UserAuthData): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(USER_AUTH_KEY, JSON.stringify(authData));
  } catch (error) {
    console.error('Failed to store user auth data:', error);
  }
}

/**
 * Retrieve user auth data from localStorage
 */
export function getUserAuth(): UserAuthData | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(USER_AUTH_KEY);
    if (stored) {
      return JSON.parse(stored) as UserAuthData;
    }
  } catch (error) {
    console.error('Failed to retrieve user auth data:', error);
  }
  
  return null;
}

/**
 * Clear user auth data from localStorage
 */
export function clearUserAuth(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(USER_AUTH_KEY);
  } catch (error) {
    console.error('Failed to clear user auth data:', error);
  }
}

/**
 * Get user auth data, first checking URL params, then localStorage
 */
export function getUserAuthData(): UserAuthData | null {
  // First try to capture from URL (in case of fresh redirect)
  const urlAuth = captureUserAuthFromURL();
  if (urlAuth) {
    return urlAuth;
  }
  
  // Otherwise get from localStorage
  return getUserAuth();
}

/**
 * Append user auth data to URL query parameters
 * Only adds parameters that aren't already present in the URL
 */
export function appendUserAuthToUrl(url: string, authData?: UserAuthData | null): string {
  const auth = authData || getUserAuth();
  if (!auth) return url;
  
  // Handle both absolute and relative URLs
  let urlObj: URL;
  try {
    // Try parsing as absolute URL first
    urlObj = new URL(url);
  } catch {
    // If that fails, it's a relative URL, use a base
    urlObj = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  }
  
  const existingParams = urlObj.searchParams;
  
  // Only add userId if not already present - this is the most critical parameter
  if (!existingParams.has('userId') && auth.userId) {
    existingParams.set('userId', auth.userId);
  }
  
  // Only add companyId if not already present
  if (!existingParams.has('companyId') && auth.companyId) {
    existingParams.set('companyId', auth.companyId);
  }
  
  // Don't add userEmail and userName to query parameters by default
  // These will be included in headers instead
  
  // Return the URL - if it was originally relative, return relative
  if (url.startsWith('http')) {
    return urlObj.toString();
  } else {
    return urlObj.pathname + urlObj.search;
  }
}

/**
 * Add user auth data to request headers
 */
export function addUserAuthHeaders(headers: HeadersInit = {}, authData?: UserAuthData | null): HeadersInit {
  const auth = authData || getUserAuth();
  if (!auth) return headers;
  
  return {
    ...headers,
    'X-User-ID': auth.userId,
    'X-Company-ID': auth.companyId,
    'X-User-Email': auth.userEmail,
    ...(auth.userName && { 'X-User-Name': auth.userName })
  };
}

/**
 * Add user auth data to request body
 */
export function addUserAuthToBody<T extends Record<string, any>>(body: T, authData?: UserAuthData | null): T & Partial<UserAuthData> {
  const auth = authData || getUserAuth();
  if (!auth) return body;
  
  return {
    ...body,
    userId: auth.userId,
    companyId: auth.companyId,
    userEmail: auth.userEmail,
    ...(auth.userName && { userName: auth.userName })
  };
} 