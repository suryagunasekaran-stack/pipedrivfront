/**
 * POST /api/project/link-existing
 * Links an existing Xero project to a Pipedrive deal
 */
import { NextRequest, NextResponse } from 'next/server';
import { EXTERNAL_API_BASE_URL, ERROR_MESSAGES } from '@/app/constants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pipedriveDealId, pipedriveCompanyId, xeroProjectId } = body;

    // Validate required parameters
    if (!pipedriveDealId || !pipedriveCompanyId || !xeroProjectId) {
      return NextResponse.json(
        { 
          error: 'Missing required parameters: pipedriveDealId, pipedriveCompanyId, and xeroProjectId are required' 
        },
        { status: 400 }
      );
    }

    // Call external API to link the existing project
    const response = await fetch(
      `${EXTERNAL_API_BASE_URL}/api/project/link-existing`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || '',
          'Authorization': request.headers.get('authorization') || '',
        },
        body: JSON.stringify({
          pipedriveDealId,
          pipedriveCompanyId,
          xeroProjectId
        }),
      }
    );

    // Handle authentication errors
    if (response.status === 401) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          authenticated: false,
          authRequired: errorData.authRequired || 'pipedrive',
          authUrl: errorData.authUrl || '/auth/pipedrive',
          message: errorData.message || 'Authentication required'
        },
        { status: 401 }
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to link project: ${response.status}`);
    }

    const data = await response.json();
    
    // Log success
    console.log(`✅ Successfully linked Xero project ${xeroProjectId} to Pipedrive deal ${pipedriveDealId}`);
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error linking existing project:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to link existing project'
      },
      { status: 500 }
    );
  }
} 