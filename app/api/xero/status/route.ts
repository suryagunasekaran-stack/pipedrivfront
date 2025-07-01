import { NextRequest, NextResponse } from 'next/server';
import { EXTERNAL_API_BASE_URL, EXTERNAL_API_ENDPOINTS, ERROR_MESSAGES } from '@/app/constants';

/**
 * GET /api/xero/status
 * Checks Xero connection status for a given Pipedrive company
 * Includes authentication handling
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pipedriveCompanyId = searchParams.get('pipedriveCompanyId');
    const userId = searchParams.get('userId');

    if (!pipedriveCompanyId) {
      return NextResponse.json(
        { error: 'Missing required parameter: pipedriveCompanyId' },
        { status: 400 }
      );
    }

    // Build URL with all parameters including userId
    const backendUrl = new URL(`${EXTERNAL_API_BASE_URL}${EXTERNAL_API_ENDPOINTS.XERO_STATUS}`);
    backendUrl.searchParams.set('pipedriveCompanyId', pipedriveCompanyId);
    if (userId) {
      backendUrl.searchParams.set('userId', userId);
    }

    // Call external API for Xero status
    const response = await fetch(backendUrl.toString(), {
      headers: {
        'Content-Type': 'application/json',
        // Forward any cookies or authorization headers
        'Cookie': request.headers.get('cookie') || '',
        'Authorization': request.headers.get('authorization') || '',
        // Forward user ID header if present
        'X-User-ID': request.headers.get('x-user-id') || userId || '',
        'X-Company-ID': request.headers.get('x-company-id') || pipedriveCompanyId || '',
        'X-User-Email': request.headers.get('x-user-email') || '',
      },
    });
    
    // Handle authentication errors
    if (response.status === 401) {
      return NextResponse.json(
        {
          authenticated: false,
          authRequired: 'pipedrive', // Could be 'xero' depending on the specific error
          authUrl: '/auth/pipedrive',
          message: 'Authentication required to check Xero status'
        },
        { status: 401 }
      );
    }

    if (!response.ok) {
      throw new Error(`Failed to check Xero status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error checking Xero status:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.XERO_CONNECTION_ERROR },
      { status: 500 }
    );
  }
}
