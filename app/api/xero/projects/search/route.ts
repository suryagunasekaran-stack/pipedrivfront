/**
 * GET /api/xero/projects/search
 * Search for existing Xero projects with optional filters
 */
import { NextRequest, NextResponse } from 'next/server';
import { EXTERNAL_API_BASE_URL, ERROR_MESSAGES } from '@/app/constants';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Extract query parameters
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const contactId = searchParams.get('contactId') || '';
    const limit = searchParams.get('limit') || '50';
    const companyId = searchParams.get('companyId');

    // Validate required companyId
    if (!companyId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Company ID is required',
          projects: [],
          total: 0,
          returned: 0
        },
        { status: 400 }
      );
    }

    // Build query string for external API
    const queryParams = new URLSearchParams();
    if (search) queryParams.append('search', search);
    if (status) queryParams.append('status', status);
    if (contactId) queryParams.append('contactId', contactId);
    queryParams.append('limit', limit);
    queryParams.append('companyId', companyId);

    // Call external API to search projects
    const response = await fetch(
      `${EXTERNAL_API_BASE_URL}/api/xero/projects/search?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || '',
          'Authorization': request.headers.get('authorization') || '',
        },
      }
    );

    // Handle authentication errors
    if (response.status === 401) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          authenticated: false,
          authRequired: errorData.authRequired || 'xero',
          authUrl: errorData.authUrl || '/auth/xero',
          message: errorData.message || 'Xero authentication required'
        },
        { status: 401 }
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to search projects: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform the response to match our expected format
    const transformedData = {
      success: true,
      projects: data.projects || [],
      total: data.total || 0,
      returned: data.returned || (data.projects?.length || 0)
    };

    return NextResponse.json(transformedData);

  } catch (error) {
    console.error('Error searching Xero projects:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search projects',
        projects: [],
        total: 0,
        returned: 0
      },
      { status: 500 }
    );
  }
} 