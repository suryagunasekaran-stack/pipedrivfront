/**
 * GET /api/pipedrive/create-project
 * Fetches project data for validation before creation
 */
import { NextRequest, NextResponse } from 'next/server';
import { EXTERNAL_API_BASE_URL, EXTERNAL_API_ENDPOINTS, ERROR_MESSAGES } from '@/app/constants';

/**
 * List of expected validation error messages that should be logged as warnings, not errors
 */
const EXPECTED_VALIDATION_ERRORS = [
  'Department is required for project creation',
  'required for project creation',
  'missing',
  'not specified',
  'invalid',
  'Vessel Name is required',
  'Location is required',
  'Sales In Charge is required',
];

/**
 * Checks if an error message is an expected validation error
 */
function isExpectedValidationError(errorMessage: string): boolean {
  return EXPECTED_VALIDATION_ERRORS.some(validationMsg => 
    errorMessage.toLowerCase().includes(validationMsg.toLowerCase())
  );
}

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
      const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
      
      // Check if this is an expected validation error
      if (isExpectedValidationError(errorMessage)) {
        // Log validation errors as warnings, not errors (cleaner logs)
        console.warn(`⚠️  Expected validation error for deal ${dealId}:`, errorMessage);
      } else {
        // Log unexpected errors normally
        console.error(`❌ Unexpected API error for deal ${dealId}:`, errorMessage);
      }
      
      // Still return the error to the client, but with cleaner server logs
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`✅ Project data loaded successfully for deal ${dealId}`);
    return NextResponse.json(data);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.DATA_FETCH_ERROR;
    
    // Log unexpected errors (network issues, etc.)
    console.error('❌ Unexpected error in project data fetch:', error);
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
