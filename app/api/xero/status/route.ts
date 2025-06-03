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

    if (!pipedriveCompanyId) {
      return NextResponse.json(
        { error: 'Missing required parameter: pipedriveCompanyId' },
        { status: 400 }
      );
    }

    // Call external API for Xero status
    const response = await fetch(`${EXTERNAL_API_BASE_URL}${EXTERNAL_API_ENDPOINTS.XERO_STATUS}?pipedriveCompanyId=${pipedriveCompanyId}`, {
      headers: {
        'Content-Type': 'application/json',
        // Forward any cookies or authorization headers
        'Cookie': request.headers.get('cookie') || '',
        'Authorization': request.headers.get('authorization') || '',
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
