import { NextRequest, NextResponse } from 'next/server';
import { EXTERNAL_API_BASE_URL, EXTERNAL_API_ENDPOINTS, ERROR_MESSAGES } from '@/app/constants';

/**
 * GET /api/pipedrive/data
 * Fetches Pipedrive deal data including organization, person, and products
 * Includes authentication handling with proper redirect responses
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('dealId');
    const companyId = searchParams.get('companyId');
    const userId = searchParams.get('userId');

    if (!dealId || !companyId) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.MISSING_DEAL_ID },
        { status: 400 }
      );
    }

    // Build URL with all parameters including userId
    const backendUrl = new URL(`${EXTERNAL_API_BASE_URL}${EXTERNAL_API_ENDPOINTS.PIPEDRIVE_DATA}`);
    backendUrl.searchParams.set('dealId', dealId);
    backendUrl.searchParams.set('companyId', companyId);
    if (userId) {
      backendUrl.searchParams.set('userId', userId);
    }

    // Call external API for Pipedrive data
    const response = await fetch(backendUrl.toString(), {
      headers: {
        'Content-Type': 'application/json',
        // Forward any cookies or authorization headers
        'Cookie': request.headers.get('cookie') || '',
        'Authorization': request.headers.get('authorization') || '',
        // Forward user ID header if present
        'X-User-ID': request.headers.get('x-user-id') || userId || '',
        'X-Company-ID': request.headers.get('x-company-id') || companyId || '',
        'X-User-Email': request.headers.get('x-user-email') || '',
      },
    });
    
    // Handle authentication errors from external API
    if (response.status === 401) {
      return NextResponse.json(
        {
          authenticated: false,
          authRequired: 'pipedrive',
          authUrl: '/auth/pipedrive',
          message: 'Pipedrive authentication required'
        },
        { status: 401 }
      );
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching Pipedrive data:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.DATA_FETCH_ERROR },
      { status: 500 }
    );
  }
}
