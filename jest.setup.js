// jest.setup.js
import { server } from './__tests__/mocks/server.js'; // Use .js if your test env expects it, or .ts if configured

// Establish API mocking before all tests.
beforeAll(() => server.listen());

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished.
afterAll(() => server.close());

// Optional: Increase timeout for async operations if needed, though MSW is usually fast
// jest.setTimeout(10000);

// Polyfill for fetch if running in Node environment older than 18, MSW might need it.
// However, modern Jest/Vitest with Node 18+ usually have fetch globally.
// if (typeof fetch === 'undefined') {
//   const { default: fetch, Headers, Request, Response } = await import('node-fetch');
//   global.fetch = fetch;
//   global.Headers = Headers;
//   global.Request = Request;
//   global.Response = Response;
// }

// Mock window.location.href for testing redirects
// Store the original window.location
const originalLocation = typeof window !== 'undefined' ? window.location : undefined;

beforeEach(() => {
  if (typeof window !== 'undefined') {
    // Create a new object for window.location with a mock implementation for href
    // @ts-ignore
    delete window.location;
    // @ts-ignore
    window.location = Object.defineProperties(
      {},
      {
        ...Object.getOwnPropertyDescriptors(originalLocation),
        assign: {
          configurable: true,
          value: jest.fn(),
        },
        replace: {
          configurable: true,
          value: jest.fn(),
        },
        href: {
          // Provide a setter for href that can be spied on or checked
          configurable: true,
          writable: true,
          value: originalLocation ? originalLocation.href : 'http://localhost:3001/test-page',
        },
      }
    );
  }
});

afterEach(() => {
  // Restore window.location to its original state
  if (typeof window !== 'undefined' && originalLocation) {
    window.location = originalLocation;
  }
  jest.clearAllMocks();
});
