/**
 * POST /api/project/create-full
 * Creates a full project from Pipedrive deal data
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

    // TODO: Replace with actual external API call
    // For testing purposes, simulate project creation with delay
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call delay

    const mockResponse = {
      success: true,
      projectId: `proj_${Date.now()}`,
      message: "Project created successfully",
      pipedriveUrl: `https://bsei-sandbox.pipedrive.com/deal/${dealId}`,
      dealId,
      companyId
    };

    return NextResponse.json(mockResponse);

  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : ERROR_MESSAGES.PROJECT_CREATION_ERROR },
      { status: 500 }
    );
  }
}
