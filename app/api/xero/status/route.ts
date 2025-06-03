import { NextRequest, NextResponse } from 'next/server';
import { EXTERNAL_API_BASE_URL, EXTERNAL_API_ENDPOINTS, ERROR_MESSAGES } from '@/app/constants';

/**
 * GET /api/xero/status
 * Checks Xero connection status for a given Pipedrive company
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

    // TODO: Replace with actual Xero API integration
    // This is a placeholder for the actual API call
    const mockResponse = await fetch(`${EXTERNAL_API_BASE_URL}${EXTERNAL_API_ENDPOINTS.XERO_STATUS}?pipedriveCompanyId=${pipedriveCompanyId}`);
    
    if (!mockResponse.ok) {
      throw new Error(`Failed to check Xero status: ${mockResponse.status}`);
    }

    const data = await mockResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error checking Xero status:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.XERO_CONNECTION_ERROR },
      { status: 500 }
    );
  }
}
