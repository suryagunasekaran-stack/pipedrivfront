/**
 * POST /api/project/create-full
 * Creates a full project from Pipedrive deal data
 * Includes authentication handling
 */
import { NextRequest, NextResponse } from 'next/server';
import { EXTERNAL_API_BASE_URL, EXTERNAL_API_ENDPOINTS, ERROR_MESSAGES } from '@/app/constants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pipedriveDealId, xeroQuoteNumber, pipedriveCompanyId } = body;

    console.log('Request body:', body);

    if (!pipedriveDealId || !pipedriveCompanyId) {
      return NextResponse.json(
        { error: 'Missing required parameters: pipedriveDealId and pipedriveCompanyId' },
        { status: 400 }
      );
    }

    // Call external API for full project creation
    const response = await fetch(`${EXTERNAL_API_BASE_URL}${EXTERNAL_API_ENDPOINTS.PROJECT_CREATE_FULL}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        // Forward any cookies or authorization headers
        'Cookie': request.headers.get('cookie') || '',
        'Authorization': request.headers.get('authorization') || '',
      },
      body: JSON.stringify({ pipedriveDealId, xeroQuoteNumber, pipedriveCompanyId }),
    });

    // Handle authentication errors
    if (response.status === 401) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          authenticated: false,
          authRequired: errorData.authRequired || 'pipedrive',
          authUrl: errorData.authUrl || '/auth/pipedrive',
          message: errorData.message || 'Authentication required to create project'
        },
        { status: 401 }
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to create project: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : ERROR_MESSAGES.PROJECT_CREATION_ERROR },
      { status: 500 }
    );
  }
}
