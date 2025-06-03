import { NextRequest, NextResponse } from 'next/server';
import { EXTERNAL_API_BASE_URL } from '@/app/constants';

/**
 * GET /api/auth/xero-auth-url
 * Gets the Xero OAuth authorization URL with Pipedrive company association
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pipedriveCompanyId = searchParams.get('pipedriveCompanyId');

    if (!pipedriveCompanyId) {
      return NextResponse.json(
        { error: 'Pipedrive Company ID is required' },
        { status: 400 }
      );
    }

    // Call external API to get Xero auth URL
    const response = await fetch(`${EXTERNAL_API_BASE_URL}/auth/xero-auth-url?pipedriveCompanyId=${pipedriveCompanyId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to get Xero auth URL' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error getting Xero auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to get Xero authorization URL' },
      { status: 500 }
    );
  }
}
