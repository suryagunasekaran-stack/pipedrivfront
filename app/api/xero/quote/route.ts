import { NextRequest, NextResponse } from 'next/server';
import { EXTERNAL_API_BASE_URL, EXTERNAL_API_ENDPOINTS, ERROR_MESSAGES } from '@/app/constants';

/**
 * POST /api/xero/quote
 * Creates a Xero quote from Pipedrive deal data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pipedriveDealId, pipedriveCompanyId } = body;

    if (!pipedriveDealId || !pipedriveCompanyId) {
      return NextResponse.json(
        { error: 'Missing required parameters: pipedriveDealId and pipedriveCompanyId' },
        { status: 400 }
      );
    }

    // TODO: Replace with actual Xero API integration
    // This is a placeholder for the actual API call
    const mockResponse = await fetch(`${EXTERNAL_API_BASE_URL}${EXTERNAL_API_ENDPOINTS.XERO_QUOTE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pipedriveDealId, pipedriveCompanyId }),
    });

    if (!mockResponse.ok) {
      const errorData = await mockResponse.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to create quote: ${mockResponse.status}`);
    }

    const data = await mockResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error creating Xero quote:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : ERROR_MESSAGES.QUOTE_CREATION_ERROR },
      { status: 500 }
    );
  }
}
