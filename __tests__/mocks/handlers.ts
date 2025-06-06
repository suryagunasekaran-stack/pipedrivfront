import { http, HttpResponse } from 'msw';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export const handlers = [
  // --- Auth Endpoints ---
  http.get(`${API_BASE_URL}/auth/status`, ({ request }) => {
    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId');
    if (!companyId) {
      return HttpResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }
    // Simulate different scenarios based on companyId for testing
    if (companyId === 'authed-fully') {
      return HttpResponse.json({
        authenticated: true,
        services: { pipedrive: true, xero: true },
        companyId,
      });
    }
    if (companyId === 'authed-pipedrive-only') {
      return HttpResponse.json({
        authenticated: true,
        services: { pipedrive: true, xero: false },
        companyId,
        requiresXeroConnection: true,
      });
    }
    if (companyId === 'not-authed') {
      return HttpResponse.json({
        authenticated: false,
        services: { pipedrive: false, xero: false },
        companyId,
      });
    }
    return HttpResponse.json({ error: 'Test companyId not recognized' }, { status: 500 });
  }),

  http.get(`${API_BASE_URL}/auth/auth-url`, () => {
    return HttpResponse.json({
      authUrl: 'https://oauth.pipedrive.com/oauth/authorize?client_id=testclient&redirect_uri=mock&state=teststate',
    });
  }),

  // connectXero is a redirect, not typically mocked via MSW unless testing failure of the redirect itself.
  // For most component tests, we'd verify window.location.href was set.

  http.post(`${API_BASE_URL}/auth/logout`, async ({ request }) => {
    const body = await request.json() as { companyId?: string };
    if (body.companyId) {
      return HttpResponse.json(null, { status: 204 }); // No content
    }
    return HttpResponse.json({ error: 'Company ID required for logout' }, { status: 400 });
  }),

  // --- Pipedrive Data Endpoints ---
  http.get(`${API_BASE_URL}/api/pipedrive-data`, ({ request }) => {
    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId');
    const dealId = url.searchParams.get('dealId');

    if (!companyId || !dealId) {
      return HttpResponse.json({ error: 'CompanyId and DealId are required' }, { status: 400 });
    }
    if (dealId === 'valid-deal') {
      return HttpResponse.json({
        success: true,
        deal: { id: parseInt(dealId), title: 'Test Deal', value: 1000, currency: 'USD', status: 'open', org_id: { name: 'Test Org', value: 1 } },
        person: { id: 1, name: 'Test Person', email: [{ value: 'test@example.com', primary: true }] },
        organization: { id: 1, name: 'Test Org', address: '123 Test St' },
        products: [{ id: 1, name: 'Test Product', quantity: 1, item_price: 1000, sum: 1000 }],
      });
    }
    return HttpResponse.json({ success: false, error: 'Deal not found' }, { status: 404 });
  }),

  // --- Xero Integration Endpoints ---
  http.get(`${API_BASE_URL}/api/xero/status`, ({ request }) => {
    const url = new URL(request.url);
    const pipedriveCompanyId = url.searchParams.get('pipedriveCompanyId');
    if (pipedriveCompanyId === 'xero-connected-company') {
      return HttpResponse.json({ connected: true, tenantName: 'Test Xero Tenant' });
    }
    return HttpResponse.json({ connected: false });
  }),

  http.post(`${API_BASE_URL}/api/xero/create-quote`, async ({ request }) => {
    const body = await request.json() as { pipedriveCompanyId?: string, pipedriveDealId?: string };
    if (body.pipedriveDealId === 'valid-deal-for-quote') {
      return HttpResponse.json({
        success: true,
        quoteNumber: 'QU-123',
        quoteId: 'xyz-789',
        contactName: 'Test Org',
        totalAmount: 1000,
        lineItemsCount: 1,
        pipedriveDealUpdated: true,
      });
    }
    return HttpResponse.json({ success: false, error: 'Failed to create quote' }, { status: 500 });
  }),

  // --- Project Management Endpoints ---
  http.post(`${API_BASE_URL}/api/project/create-full`, async ({ request }) => {
    const body = await request.json() as { pipedriveDealId?: string, pipedriveCompanyId?: string };
    if (body.pipedriveDealId === 'valid-deal-for-project') {
      return HttpResponse.json({
        success: true,
        projectNumber: 'PROJ-001',
        deal: { id: parseInt(body.pipedriveDealId), title: 'Project Deal' },
        metadata: { dealId: body.pipedriveDealId, companyId: body.pipedriveCompanyId!, isNewProject: true },
      });
    }
    return HttpResponse.json({ success: false, error: 'Failed to create project' }, { status: 500 });
  }),
];
