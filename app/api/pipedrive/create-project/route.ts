/**
 * GET /api/pipedrive/create-project
 * Fetches project data for validation before creation
 */
import { NextRequest, NextResponse } from 'next/server';
import { EXTERNAL_API_BASE_URL, EXTERNAL_API_ENDPOINTS, ERROR_MESSAGES } from '@/app/constants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dealId, companyId } = body;

    if (!dealId || !companyId) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.MISSING_DEAL_ID },
        { status: 400 }
      );
    }

    // Forward request to the external API
    const response = await fetch(`${EXTERNAL_API_BASE_URL}${EXTERNAL_API_ENDPOINTS.PROJECT_CREATE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dealId, companyId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching project data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : ERROR_MESSAGES.DATA_FETCH_ERROR },
      { status: 500 }
    );
  }
}
