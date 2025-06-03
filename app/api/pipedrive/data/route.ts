import { NextRequest, NextResponse } from 'next/server';
import { EXTERNAL_API_BASE_URL, EXTERNAL_API_ENDPOINTS, ERROR_MESSAGES } from '@/app/constants';

/**
 * GET /api/pipedrive/data
 * Fetches Pipedrive deal data including organization, person, and products
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('dealId');
    const companyId = searchParams.get('companyId');

    if (!dealId || !companyId) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.MISSING_DEAL_ID },
        { status: 400 }
      );
    }

    // TODO: Replace with actual Pipedrive API integration
    // This is a placeholder for the actual API call
    const mockResponse = await fetch(`${EXTERNAL_API_BASE_URL}${EXTERNAL_API_ENDPOINTS.PIPEDRIVE_DATA}?dealId=${dealId}&companyId=${companyId}`);
    
    if (!mockResponse.ok) {
      throw new Error(`Failed to fetch data: ${mockResponse.status}`);
    }

    const data = await mockResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching Pipedrive data:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.DATA_FETCH_ERROR },
      { status: 500 }
    );
  }
}
