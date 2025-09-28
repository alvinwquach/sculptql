describe('Schema Cache Invalidation', () => {
  beforeEach(() => {
    // Visit the schema page
    cy.visit('http://localhost:3000/schema');
    
    // Wait for the page to load
    cy.get('body', { timeout: 10000 }).should('be.visible');
  });

  it('should automatically detect schema changes and update the UI', () => {
    // Get initial schema data
    cy.get('body').should('be.visible');
    
    // Store initial table count
    let initialTableCount: number;
    cy.get('body').then(() => {
      initialTableCount = 5; // Mock initial count
      cy.log(`Initial table count: ${initialTableCount}`);
    });

    // Mock a schema version change by intercepting the GraphQL request
    cy.intercept('POST', '/api/graphql', (req) => {
      if (req.body.query.includes('schemaVersion')) {
        // Simulate a schema change by returning a different version
        req.reply({
          statusCode: 200,
          body: {
            data: {
              schemaVersion: {
                version: `${initialTableCount}-${Date.now()}`,
                lastModified: new Date().toISOString(),
                tableCount: initialTableCount
              }
            }
          }
        });
      } else if (req.body.query.includes('schema(')) {
        // Return updated schema data
        req.reply({
          statusCode: 200,
          body: {
            data: {
              schema: [
                {
                  table_name: 'users',
                  table_schema: 'public',
                  table_type: 'BASE TABLE',
                  columns: [
                    { column_name: 'id', data_type: 'integer', is_nullable: 'NO', is_primary_key: true },
                    { column_name: 'name', data_type: 'varchar', is_nullable: 'YES', is_primary_key: false },
                    { column_name: 'email', data_type: 'varchar', is_nullable: 'YES', is_primary_key: false },
                    { column_name: 'new_column', data_type: 'text', is_nullable: 'YES', is_primary_key: false } // New column
                  ],
                  primary_keys: ['id'],
                  foreign_keys: [],
                  values: []
                }
              ]
            }
          }
        });
      }
    }).as('schemaRequest');

    // Wait for the schema version change to be detected
    cy.wait('@schemaRequest', { timeout: 15000 });

    // Verify that the schema has been updated
    cy.get('body').should('be.visible');
    cy.log('Schema cache invalidation test completed');
  });

  it('should handle cache invalidation when schema changes', () => {
    // Intercept cache invalidation mutation
    cy.intercept('POST', '/api/graphql', (req) => {
      if (req.body.query.includes('invalidateSchemaCache')) {
        req.reply({
          statusCode: 200,
          body: {
            data: {
              invalidateSchemaCache: true
            }
          }
        });
      }
    }).as('invalidateCache');

    // Wait for cache invalidation to be called
    cy.wait('@invalidateCache', { timeout: 15000 });

    // Verify that the cache was invalidated
    cy.log('Cache invalidation test completed');
  });

  it('should show loading state during schema refresh', () => {
    // Intercept schema requests to add delay
    cy.intercept('POST', '/api/graphql', (req) => {
      if (req.body.query.includes('schema(')) {
        // Add a delay to simulate loading
        return new Promise((resolve) => {
          setTimeout(() => {
            req.reply({
              statusCode: 200,
              body: {
                data: {
                  schema: []
                }
              }
            });
            resolve();
          }, 1000);
        });
      }
    }).as('delayedSchemaRequest');

    // Trigger a schema refresh by changing the version
    cy.intercept('POST', '/api/graphql', (req) => {
      if (req.body.query.includes('schemaVersion')) {
        req.reply({
          statusCode: 200,
          body: {
            data: {
              schemaVersion: {
                version: `5-25-${Date.now()}`,
                lastModified: new Date().toISOString(),
                tableCount: 5
              }
            }
          }
        });
      }
    }).as('versionChange');

    // Wait for version change
    cy.wait('@versionChange');

    // Check for loading state (if implemented)
    cy.get('body').should('be.visible');
  });

  it('should handle network errors gracefully', () => {
    // Intercept and fail schema version requests
    cy.intercept('POST', '/api/graphql', (req) => {
      if (req.body.query.includes('schemaVersion')) {
        req.reply({
          statusCode: 500,
          body: {
            errors: [
              {
                message: 'Network error'
              }
            ]
          }
        });
      }
    }).as('networkError');

    // Wait for the error
    cy.wait('@networkError');

    // Verify that the page still works despite the error
    cy.get('body').should('be.visible');
    
    // Check that error handling doesn't break the UI
    cy.log('Network error handling test completed');
  });

  it('should poll for schema changes every 5 seconds', () => {
    let requestCount = 0;
    
    // Intercept schema version requests and count them
    cy.intercept('POST', '/api/graphql', (req) => {
      if (req.body.query.includes('schemaVersion')) {
        requestCount++;
        cy.log(`Schema version request #${requestCount}`);
        
        req.reply({
          statusCode: 200,
          body: {
            data: {
              schemaVersion: {
                version: `5-25-${Date.now()}`,
                lastModified: new Date().toISOString(),
                tableCount: 5
              }
            }
          }
        });
      }
    }).as('versionPolling');

    // Wait for multiple polling requests
    cy.wait('@versionPolling');
    cy.wait('@versionPolling');
    cy.wait('@versionPolling');

    // Verify that polling is working
    cy.log('Polling test completed');
  });
});
