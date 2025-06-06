import { http, HttpResponse } from 'msw';
import { server } from '../../../__tests__/mocks/server'; // Adjust path as needed
import { apiService, ApiError } from '../api'; // The service to test
import type { AuthStatusResponse, AuthUrlResponse, PipedriveDataResponse, XeroStatusResponse, CreateQuoteRequest, CreateQuoteResponse, CreateProjectRequest, CreateProjectResponse, LogoutRequest } from '../api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

describe('ApiService', () => {
  // Test checkAuthStatus
  describe('checkAuthStatus', () => {
    it('should return auth status on success', async () => {
      const companyId = 'authed-fully';
      const mockResponse: AuthStatusResponse = {
        authenticated: true,
        services: { pipedrive: true, xero: true },
        companyId,
      };
      server.use(
        http.get(`${API_BASE_URL}/auth/status`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('companyId')).toBe(companyId);
          return HttpResponse.json(mockResponse);
        })
      );
      const result = await apiService.checkAuthStatus(companyId);
      expect(result).toEqual(mockResponse);
    });

    it('should throw ApiError on network error for checkAuthStatus', async () => {
      server.use(
        http.get(`${API_BASE_URL}/auth/status`, () => {
          return HttpResponse.error();
        })
      );
      await expect(apiService.checkAuthStatus('test-id')).rejects.toThrow(ApiError);
    });

    it('should throw ApiError on 500 server error for checkAuthStatus', async () => {
        server.use(
          http.get(`${API_BASE_URL}/auth/status`, () => {
            return HttpResponse.json({ error: 'Server meltdown' }, { status: 500 });
          })
        );
        try {
            await apiService.checkAuthStatus('test-id');
        } catch (e) {
            expect(e).toBeInstanceOf(ApiError);
            if (e instanceof ApiError) { // Type guard
                expect(e.statusCode).toBe(500);
                expect(e.message).toContain('Server meltdown');
            }
        }
      });
  });

  // Test getPipedriveAuthUrl
  describe('getPipedriveAuthUrl', () => {
    it('should return auth URL on success', async () => {
      const mockResponse: AuthUrlResponse = { authUrl: 'http://pipedrive.com/auth' };
      server.use(
        http.get(`${API_BASE_URL}/auth/auth-url`, () => HttpResponse.json(mockResponse))
      );
      const result = await apiService.getPipedriveAuthUrl();
      expect(result).toEqual(mockResponse);
    });
  });

  // Test connectXero (verifies window.location.href is set)
  describe('connectXero', () => {
    it('should set window.location.href correctly', () => {
      const companyId = 'test-company';
      apiService.connectXero(companyId);
      expect(window.location.href).toBe(`${API_BASE_URL}/auth/connect-xero?pipedriveCompanyId=${companyId}`);
    });
  });

  // Test logout
  describe('logout', () => {
    it('should complete successfully on 204 response', async () => {
      const requestBody: LogoutRequest = { companyId: 'test-company' };
      server.use(
        http.post(`${API_BASE_URL}/auth/logout`, async ({request: req}) => {
            const body = await req.json() as LogoutRequest;
            expect(body).toEqual(requestBody);
            return HttpResponse.json(null, { status: 204 });
        })
      );
      await expect(apiService.logout(requestBody)).resolves.toBeUndefined();
    });
  });

  // Test getPipedriveData
  describe('getPipedriveData', () => {
    it('should return Pipedrive data on success', async () => {
      const companyId = 'pd-company';
      const dealId = 'pd-deal';
      const mockResponse: PipedriveDataResponse = {
        success: true,
        deal: { id: 1, title: 'Test Deal', value: 100, currency: 'USD', status: 'open', org_id: {name: 'Org', value: 1} }
      };
      server.use(
        http.get(`${API_BASE_URL}/api/pipedrive-data`, ({request}) => {
            const url = new URL(request.url);
            expect(url.searchParams.get('companyId')).toBe(companyId);
            expect(url.searchParams.get('dealId')).toBe(dealId);
            return HttpResponse.json(mockResponse);
        })
      );
      const result = await apiService.getPipedriveData(companyId, dealId);
      expect(result).toEqual(mockResponse);
    });
  });

  // Test checkXeroStatus
  describe('checkXeroStatus', () => {
    it('should return Xero status on success', async () => {
      const companyId = 'xero-company';
      const mockResponse: XeroStatusResponse = { connected: true, tenantName: 'Test Tenant' };
      server.use(
        http.get(`${API_BASE_URL}/api/xero/status`, ({request}) => {
            const url = new URL(request.url);
            expect(url.searchParams.get('pipedriveCompanyId')).toBe(companyId);
            return HttpResponse.json(mockResponse);
        })
      );
      const result = await apiService.checkXeroStatus(companyId);
      expect(result).toEqual(mockResponse);
    });
  });

  // Test createQuote
  describe('createQuote', () => {
    it('should return quote response on successful creation', async () => {
      const requestBody: CreateQuoteRequest = { pipedriveCompanyId: 'c1', pipedriveDealId: 'd1' };
      const mockResponse: CreateQuoteResponse = {
        success: true, quoteNumber: 'Q-001', quoteId: 'qid1', contactName: 'Cust', totalAmount: 200, lineItemsCount: 2, pipedriveDealUpdated: false
      };
      server.use(
        http.post(`${API_BASE_URL}/api/xero/create-quote`, async ({request: req}) => {
            expect(await req.json()).toEqual(requestBody);
            return HttpResponse.json(mockResponse);
        })
      );
      const result = await apiService.createQuote(requestBody);
      expect(result).toEqual(mockResponse);
    });
  });

  // Test createProject
  describe('createProject', () => {
    it('should return project response on successful creation', async () => {
      const requestBody: CreateProjectRequest = { pipedriveCompanyId: 'c1', pipedriveDealId: 'd1', existingProjectNumberToLink: 'P007' };
      const mockResponse: CreateProjectResponse = {
        success: true, projectNumber: 'P008', deal: {}, metadata: { dealId: 'd1', companyId: 'c1', isNewProject: true}
      };
       server.use(
        http.post(`${API_BASE_URL}/api/project/create-full`, async ({request: req}) => {
            expect(await req.json()).toEqual(requestBody);
            return HttpResponse.json(mockResponse);
        })
      );
      const result = await apiService.createProject(requestBody);
      expect(result).toEqual(mockResponse);
    });
  });
});
