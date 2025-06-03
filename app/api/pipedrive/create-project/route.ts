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

    // TODO: Replace with actual external API call
    // For testing purposes, return mock data
    const mockData = {
      deal: {
        id: dealId,
        title: "Sample Web Development Project",
        value: 15000,
        currency: "USD",
        status: "open"
      },
      organization: {
        id: companyId,
        name: "Acme Corporation",
        address: "123 Business St, City, State 12345"
      },
      person: {
        id: "person_123",
        name: "John Smith",
        email: "john.smith@acme.com",
        phone: "+1-555-0123"
      },
      products: [
        {
          id: "prod_1",
          name: "Web Development",
          quantity: 1,
          unit_price: 15000,
          total: 15000
        }
      ]
    };

    return NextResponse.json(mockData);

  } catch (error) {
    console.error('Error fetching project data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : ERROR_MESSAGES.DATA_FETCH_ERROR },
      { status: 500 }
    );
  }
}
