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
function isExpectedValidationError(errorMessage: any): boolean {
  // Ensure errorMessage is a string before calling toLowerCase()
  if (typeof errorMessage !== 'string') {
    return false;
  }
  
  return EXPECTED_VALIDATION_ERRORS.some(validationMsg => 
    errorMessage.toLowerCase().includes(validationMsg.toLowerCase())
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('dealId');
    const companyId = searchParams.get('companyId');
    const userId = searchParams.get('userId');

    if (!dealId || !companyId) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.MISSING_DEAL_ID },
        { status: 400 }
      );
    }

    // Build URL with all parameters including userId
    const backendUrl = new URL(`${EXTERNAL_API_BASE_URL}${EXTERNAL_API_ENDPOINTS.PROJECT_CREATE}`);
    backendUrl.searchParams.set('dealId', dealId);
    backendUrl.searchParams.set('companyId', companyId);
    if (userId) {
      backendUrl.searchParams.set('userId', userId);
    }

    // Forward GET request to the external API
    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
        'Authorization': request.headers.get('authorization') || '',
        // Forward user ID header if present
        'X-User-ID': request.headers.get('x-user-id') || userId || '',
        'X-Company-ID': request.headers.get('x-company-id') || companyId || '',
        'X-User-Email': request.headers.get('x-user-email') || '',
      },
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dealId, companyId, userId, userEmail, userName } = body;

    if (!dealId || !companyId) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.MISSING_DEAL_ID },
        { status: 400 }
      );
    }

    // Forward request to the external API with all auth data
    const response = await fetch(`${EXTERNAL_API_BASE_URL}${EXTERNAL_API_ENDPOINTS.PROJECT_CREATE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward user ID header if present
        'X-User-ID': request.headers.get('x-user-id') || userId || '',
        'X-Company-ID': request.headers.get('x-company-id') || companyId || '',
        'X-User-Email': request.headers.get('x-user-email') || userEmail || '',
      },
      body: JSON.stringify({ dealId, companyId, userId, userEmail, userName }),
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
