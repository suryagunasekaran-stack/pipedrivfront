import { NextRequest, NextResponse } from 'next/server';
import { EXTERNAL_API_BASE_URL } from '@/app/constants';

/**
 * GET /api/auth/check-auth
 * Checks if user has valid authentication for Pipedrive and Xero
 */
export async function GET(request: NextRequest) {
  try {
    // Get companyId from query parameters
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    // Prepare headers for external API call
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Forward cookies if they exist
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    // Forward authorization header if it exists
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Build URL with companyId if provided
    let authCheckUrl = `${EXTERNAL_API_BASE_URL}/auth/check-auth`;
    if (companyId) {
      authCheckUrl += `?companyId=${encodeURIComponent(companyId)}`;
    }

    // Call external API to check authentication status
    const response = await fetch(authCheckUrl, {
      method: 'GET',
      headers,
    });

    // Handle response based on status code
    let data: any = {};
    try {
      data = await response.json();
    } catch (parseError) {
      console.warn('Failed to parse auth check response:', parseError);
    }

    // If external API returns 401, user needs authentication
    if (response.status === 401) {
      return NextResponse.json(
        {
          authenticated: false,
          authRequired: data.authRequired || 'pipedrive',
          authUrl: data.authUrl || '/auth/pipedrive',
          message: data.message || 'Authentication required'
        },
        { status: 200 } // Return 200 so client can handle redirect gracefully
      );
    }

    // If external API returns 404, the endpoint doesn't exist - treat as unauthenticated
    if (response.status === 404) {
      console.warn('Backend auth check endpoint not found - treating as unauthenticated');
      return NextResponse.json(
        {
          authenticated: false,
          authRequired: 'pipedrive',
          authUrl: '/auth/pipedrive',
          message: 'Authentication required - backend auth check unavailable'
        },
        { status: 200 }
      );
    }

    // If external API returns 400 or other client errors, treat as unauthenticated
    if (response.status >= 400 && response.status < 500) {
      console.warn(`External auth API returned ${response.status}, treating as unauthenticated. Response:`, data);
      return NextResponse.json(
        {
          authenticated: false,
          authRequired: 'pipedrive',
          authUrl: '/auth/pipedrive',
          message: 'Authentication required - please sign in to Pipedrive'
        },
        { status: 200 }
      );
    }

    // If external API returns 500+ errors, treat as unauthenticated but log the error
    if (!response.ok) {
      console.error(`External auth API error ${response.status}:`, data);
      return NextResponse.json(
        {
          authenticated: false,
          authRequired: 'pipedrive',
          authUrl: '/auth/pipedrive',
          message: 'Authentication service temporarily unavailable'
        },
        { status: 200 }
      );
    }

    // User is authenticated
    return NextResponse.json({
      authenticated: true,
      message: 'User is authenticated',
      ...data
    });

  } catch (error) {
    console.error('Error checking authentication:', error);
    
    // Default to requiring Pipedrive auth on error
    return NextResponse.json(
      {
        authenticated: false,
        authRequired: 'pipedrive',
        authUrl: '/auth/pipedrive',
        message: 'Authentication check failed - please authenticate'
      },
      { status: 200 }
    );
  }
}
