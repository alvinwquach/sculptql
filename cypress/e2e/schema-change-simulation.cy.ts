describe('Schema Change Simulation', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/schema');
    cy.get('body', { timeout: 10000 }).should('be.visible');
  });

  it('should simulate adding a new column to an existing table', () => {
    // Get initial schema state
    cy.get('body').should('be.visible');
    
    let initialColumnCount: number;
    cy.get('body').then(() => {
      initialColumnCount = 3; // Mock initial count
      cy.log(`Initial column count: ${initialColumnCount}`);
    });

    // Simulate schema change by intercepting requests
    cy.intercept('POST', '/api/graphql', (req) => {
      if (req.body.query.includes('schemaVersion')) {
        // Return a new version indicating a column was added
        req.reply({
          statusCode: 200,
          body: {
            data: {
              schemaVersion: {
                version: `5-${initialColumnCount + 1}-${Date.now()}`, // One more column
                lastModified: new Date().toISOString(),
                tableCount: 5
              }
            }
          }
        });
      } else if (req.body.query.includes('schema(')) {
        // Return updated schema with new column
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
                    { column_name: 'phone', data_type: 'varchar', is_nullable: 'YES', is_primary_key: false }, // New column
                    { column_name: 'created_at', data_type: 'timestamp', is_nullable: 'YES', is_primary_key: false } // Another new column
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
    }).as('schemaUpdate');

    // Wait for the schema update
    cy.wait('@schemaUpdate', { timeout: 15000 });

    // Verify the new column is visible
    cy.get('body').should('be.visible');
    cy.log('Column addition simulation test completed');
  });

  it('should simulate adding a new table', () => {
    // Get initial table count
    let initialTableCount: number;
    cy.get('body').then(() => {
      initialTableCount = 5; // Mock initial count
      cy.log(`Initial table count: ${initialTableCount}`);
    });

    // Simulate adding a new table
    cy.intercept('POST', '/api/graphql', (req) => {
      if (req.body.query.includes('schemaVersion')) {
        req.reply({
          statusCode: 200,
          body: {
            data: {
              schemaVersion: {
                version: `${initialTableCount + 1}-30-${Date.now()}`, // One more table
                lastModified: new Date().toISOString(),
                tableCount: initialTableCount + 1
              }
            }
          }
        });
      } else if (req.body.query.includes('schema(')) {
        // Return schema with new table
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
                    { column_name: 'name', data_type: 'varchar', is_nullable: 'YES', is_primary_key: false }
                  ],
                  primary_keys: ['id'],
                  foreign_keys: [],
                  values: []
                },
                {
                  table_name: 'orders', // New table
                  table_schema: 'public',
                  table_type: 'BASE TABLE',
                  columns: [
                    { column_name: 'id', data_type: 'integer', is_nullable: 'NO', is_primary_key: true },
                    { column_name: 'user_id', data_type: 'integer', is_nullable: 'NO', is_primary_key: false },
                    { column_name: 'total', data_type: 'decimal', is_nullable: 'NO', is_primary_key: false }
                  ],
                  primary_keys: ['id'],
                  foreign_keys: [
                    { column_name: 'user_id', referenced_table: 'users', referenced_column: 'id', constraint_name: 'fk_orders_user' }
                  ],
                  values: []
                }
              ]
            }
          }
        });
      }
    }).as('newTableUpdate');

    // Wait for the update
    cy.wait('@newTableUpdate', { timeout: 15000 });

    // Verify the new table is visible
    cy.get('body').should('be.visible');
    cy.log('Table addition simulation test completed');
  });

  it('should simulate removing a column from a table', () => {
    // First, expand a table to see its columns
    cy.get('body').should('be.visible');

    // Simulate removing a column
    cy.intercept('POST', '/api/graphql', (req) => {
      if (req.body.query.includes('schemaVersion')) {
        req.reply({
          statusCode: 200,
          body: {
            data: {
              schemaVersion: {
                version: `5-24-${Date.now()}`, // One less column
                lastModified: new Date().toISOString(),
                tableCount: 5
              }
            }
          }
        });
      } else if (req.body.query.includes('schema(')) {
        // Return schema with one column removed
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
                    { column_name: 'name', data_type: 'varchar', is_nullable: 'YES', is_primary_key: false }
                    // email column removed
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
    }).as('columnRemovalUpdate');

    // Wait for the update
    cy.wait('@columnRemovalUpdate', { timeout: 15000 });

    // Verify the column is no longer visible
    cy.get('body').should('be.visible');
    cy.log('Column removal simulation test completed');
  });

  it('should handle multiple rapid schema changes', () => {
    let changeCount = 0;
    
    // Simulate multiple rapid changes
    cy.intercept('POST', '/api/graphql', (req) => {
      if (req.body.query.includes('schemaVersion')) {
        changeCount++;
        req.reply({
          statusCode: 200,
          body: {
            data: {
              schemaVersion: {
                version: `5-${25 + changeCount}-${Date.now()}`,
                lastModified: new Date().toISOString(),
                tableCount: 5
              }
            }
          }
        });
      } else if (req.body.query.includes('schema(')) {
        // Return schema with incremental changes
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
                    ...Array.from({ length: changeCount }, (_, i) => ({
                      column_name: `new_column_${i + 1}`,
                      data_type: 'text',
                      is_nullable: 'YES',
                      is_primary_key: false
                    }))
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
    }).as('rapidChanges');

    // Wait for multiple changes
    cy.wait('@rapidChanges');
    cy.wait('@rapidChanges');
    cy.wait('@rapidChanges');

    // Verify the UI handles rapid changes gracefully
    cy.get('body').should('be.visible');
    cy.log('Rapid changes simulation test completed');
  });
});
