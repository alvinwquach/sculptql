import { expect } from '@jest/globals';

// Describe the Schema Version API
describe('Schema Version API', () => {
  // It should export API handlers
  it('should export API handlers', () => {
    // Import the api route
    const apiRoute = require('@/app/api/graphql/route');
    // Expect the api route to be defined
    expect(apiRoute).toBeDefined();
    // Expect the api route GET to be defined
    expect(apiRoute.GET).toBeDefined();
    // Expect the api route POST to be defined
    expect(apiRoute.POST).toBeDefined();
    // Expect the api route OPTIONS to be defined
    expect(apiRoute.OPTIONS).toBeDefined();
  });
  // It should have proper function types
  it('should have proper function types', () => {
    const apiRoute = require('@/app/api/graphql/route');
    // Expect the api route GET to be a function
    expect(typeof apiRoute.GET).toBe('function');
    // Expect the api route POST to be a function
    expect(typeof apiRoute.POST).toBe('function');
    // Expect the api route OPTIONS to be a function
    expect(typeof apiRoute.OPTIONS).toBe('function');
  });
});
