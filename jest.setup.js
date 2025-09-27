// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Suppress console outputs during tests to keep output clean
// While still allowing tests to verify logging behavior
const originalError = console.error;
const originalLog = console.log;

beforeAll(() => {
  console.error = (...args) => {
    // Still allow tests to spy on console.error if needed
    if (expect.getState().currentTestName) {
      // Only suppress in test environment, not for test debugging
      if (args[0]?.includes?.('act(...)') || 
          args[0]?.includes?.('Error in GET') ||
          args[0]?.includes?.('Error in POST') ||
          args[0]?.includes?.('Error validating') ||
          args[0]?.includes?.('Error fetching')) {
        return;
      }
    }
    originalError(...args);
  };

  console.log = (...args) => {
    // Suppress API route logs and other verbose logging during tests
    if (expect.getState().currentTestName) {
      if (args[0]?.includes?.('[Referral') ||
          args[0]?.includes?.('Stored referral code') ||
          args[0]?.includes?.('Tracking referral') ||
          args[0]?.includes?.('Validating referral') ||
          args[0]?.includes?.('Referral code is') ||
          args[0]?.includes?.('Referral tracked') ||
          args[0]?.includes?.('User signed up, tracking') ||
          args[0]?.includes?.('Invalid referral code') ||
          args[0]?.includes?.('tracking failed')) {
        return;
      }
    }
    originalLog(...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.log = originalLog;
});

// Polyfill for Next.js server-side APIs in tests
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init) {
      // Use Object.defineProperty for read-only properties
      Object.defineProperty(this, 'url', {
        value: input,
        writable: false,
        enumerable: true,
        configurable: true
      });
      this.method = init?.method || 'GET';
      this.headers = new Map(Object.entries(init?.headers || {}));
      this.body = init?.body;
    }
  };
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init) {
      this.body = body;
      this.status = init?.status || 200;
      this.statusText = init?.statusText || 'OK';
      this.headers = new Map(Object.entries(init?.headers || {}));
    }
    
    async json() {
      if (typeof this.body === 'string') {
        return JSON.parse(this.body);
      }
      return this.body;
    }
    
    static json(data, init) {
      return new Response(JSON.stringify(data), {
        ...init,
        headers: {
          'content-type': 'application/json',
          ...(init?.headers || {})
        }
      });
    }
  };
} 