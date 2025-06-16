import { NextRequest, NextResponse } from 'next/server';
import { EXTERNAL_API_BASE_URL, EXTERNAL_API_ENDPOINTS, ERROR_MESSAGES } from '@/app/constants';

/**
 * POST /api/xero/quote
 * Creates a Xero quote from Pipedrive deal data
 * Includes authentication handling
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      pipedriveDealId, 
      pipedriveCompanyId,
      userId,
      userEmail,
      userName,
      tenantId,
      xeroConnected,
      xeroJustConnected
    } = body;

    if (!pipedriveDealId || !pipedriveCompanyId) {
      return NextResponse.json(
        { error: 'Missing required parameters: pipedriveDealId and pipedriveCompanyId' },
        { status: 400 }
      );
    }

    // Prepare request body with all available parameters
    const requestBody: any = {
      pipedriveDealId,
      pipedriveCompanyId
    };

    // Include additional parameters if they exist
    if (userId) requestBody.userId = userId;
    if (userEmail) requestBody.userEmail = userEmail;
    if (userName) requestBody.userName = userName;
    if (tenantId) requestBody.tenantId = tenantId;
    if (xeroConnected !== undefined) requestBody.xeroConnected = xeroConnected;
    if (xeroJustConnected !== undefined) requestBody.xeroJustConnected = xeroJustConnected;

    // Call external API for Xero quote creation
    const response = await fetch(`${EXTERNAL_API_BASE_URL}${EXTERNAL_API_ENDPOINTS.XERO_QUOTE}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        // Forward any cookies or authorization headers
        'Cookie': request.headers.get('cookie') || '',
        'Authorization': request.headers.get('authorization') || '',
      },
      body: JSON.stringify(requestBody),
    });

    // Handle authentication errors
    if (response.status === 401) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          authenticated: false,
          authRequired: errorData.authRequired || 'xero',
          authUrl: errorData.authUrl || `/auth/xero?pipedriveCompanyId=${pipedriveCompanyId}`,
          message: errorData.message || 'Authentication required to create Xero quote'
        },
        { status: 401 }
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to create quote: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error creating Xero quote:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : ERROR_MESSAGES.QUOTE_CREATION_ERROR },
      { status: 500 }
    );
  }
}
