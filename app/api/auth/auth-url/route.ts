import { NextRequest, NextResponse } from 'next/server';
import { EXTERNAL_API_BASE_URL } from '@/app/constants';

/**
 * GET /api/auth/auth-url
 * Gets the Pipedrive OAuth authorization URL
 */
export async function GET(request: NextRequest) {
  try {
    // Call external API to get Pipedrive auth URL
    const response = await fetch(`${EXTERNAL_API_BASE_URL}/auth/auth-url`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to get auth URL' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error getting Pipedrive auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to get Pipedrive authorization URL' },
      { status: 500 }
    );
  }
}
