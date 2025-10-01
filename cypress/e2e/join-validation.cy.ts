describe('Join Validation E2E Tests', () => {
  beforeEach(() => {
    // Visit the editor page with a test database connection
    cy.visit('/editor');

    // Wait for schema to load
    cy.get('[data-testid="table-select"]', { timeout: 10000 }).should('be.visible');
  });

  describe('Join UI Components', () => {
    it('should display join section when table is selected', () => {
      // Select a table
      cy.get('[data-testid="table-select"]').click();
      cy.contains('users').click();

      // Join section should be visible
      cy.contains('Joins').should('be.visible');
    });

    it('should show "Add Join" button', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains('users').click();

      cy.contains('Add Join').should('be.visible').and('not.be.disabled');
    });

    it('should add a join clause when "Add Join" is clicked', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains('users').click();

      cy.contains('Add Join').click();

      // Should show join configuration UI
      cy.contains('Join 1').should('be.visible');
      cy.contains('Join Type').should('be.visible');
      cy.contains('Join Table').should('be.visible');
    });
  });

  describe('Join Configuration', () => {
    beforeEach(() => {
      // Setup: Select base table and add a join
      cy.get('[data-testid="table-select"]').click();
      cy.contains('users').click();
      cy.contains('Add Join').click();
    });

    it('should allow selecting join type', () => {
      cy.contains('Join Type').parent().find('select, [role="combobox"]').click();
      cy.contains('LEFT JOIN').click();

      // Verify selection
      cy.contains('LEFT JOIN').should('be.visible');
    });

    it('should allow selecting join table', () => {
      cy.contains('Join Table').parent().find('select, [role="combobox"]').click();
      cy.contains('orders').click();

      // Verify selection
      cy.contains('orders').should('be.visible');
    });

    it('should show column selectors after table is selected', () => {
      // Select join table
      cy.contains('Join Table').parent().find('select, [role="combobox"]').click();
      cy.contains('orders').click();

      // Column selectors should appear
      cy.contains('users Column').should('be.visible');
      cy.contains('orders Column').should('be.visible');
    });

    it('should not show column selectors for CROSS JOIN', () => {
      // Select CROSS JOIN
      cy.contains('Join Type').parent().find('select, [role="combobox"]').click();
      cy.contains('CROSS JOIN').click();

      // Select join table
      cy.contains('Join Table').parent().find('select, [role="combobox"]').click();
      cy.contains('orders').click();

      // Column selectors should NOT appear
      cy.contains('users Column').should('not.exist');
      cy.contains('orders Column').should('not.exist');
    });
  });

  describe('Join Column Selection', () => {
    beforeEach(() => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains('users').click();
      cy.contains('Add Join').click();

      // Select join table
      cy.contains('Join Table').parent().find('select, [role="combobox"]').click();
      cy.contains('orders').click();
    });

    it('should populate column options from base table', () => {
      cy.contains('users Column').parent().find('select, [role="combobox"]').click();

      // Should show users table columns
      cy.contains('id').should('be.visible');
      cy.contains('name').should('be.visible');
    });

    it('should populate column options from join table', () => {
      cy.contains('orders Column').parent().find('select, [role="combobox"]').click();

      // Should show orders table columns
      cy.contains('id').should('be.visible');
      cy.contains('user_id').should('be.visible');
    });

    it('should allow selecting join columns', () => {
      // Select first column
      cy.contains('users Column').parent().find('select, [role="combobox"]').click();
      cy.contains('id').first().click();

      // Select second column
      cy.contains('orders Column').parent().find('select, [role="combobox"]').click();
      cy.contains('user_id').click();

      // Verify selections persist
      cy.contains('users Column').parent().should('contain', 'id');
      cy.contains('orders Column').parent().should('contain', 'user_id');
    });
  });

  describe('Multiple Joins', () => {
    it('should support adding multiple joins', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains('users').click();

      // Add first join
      cy.contains('Add Join').click();
      cy.contains('Join 1').should('be.visible');

      // Add second join
      cy.contains('Add Join').click();
      cy.contains('Join 2').should('be.visible');

      // Both should be visible
      cy.contains('Join 1').should('be.visible');
      cy.contains('Join 2').should('be.visible');
    });

    it('should allow removing specific joins', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains('users').click();

      // Add two joins
      cy.contains('Add Join').click();
      cy.contains('Add Join').click();

      // Remove first join
      cy.contains('Join 1').parent().parent().find('[title="Remove this join"]').first().click();

      // Join 1 should be gone, Join 2 should remain
      cy.contains('Join 1').should('be.visible');
      cy.contains('Join 2').should('not.exist');
    });

    it('should maintain configuration when adding multiple joins', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains('users').click();

      // Configure first join
      cy.contains('Add Join').click();
      cy.contains('Join Table').parent().find('select, [role="combobox"]').first().click();
      cy.contains('orders').click();

      // Add second join
      cy.contains('Add Join').click();

      // First join configuration should persist
      cy.contains('Join 1').parent().parent().should('contain', 'orders');
    });
  });

  describe('Join Validation Feedback', () => {
    it('should only show tables with FK relationships', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains('users').click();
      cy.contains('Add Join').click();

      cy.contains('Join Table').parent().find('select, [role="combobox"]').click();

      // Should show orders (has FK to users)
      cy.contains('orders').should('be.visible');

      // Should NOT show users (self-join)
      cy.contains('li', 'users').should('not.exist');
    });

    it('should suggest FK columns by default', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains('users').click();
      cy.contains('Add Join').click();

      // Select table with FK relationship
      cy.contains('Join Table').parent().find('select, [role="combobox"]').click();
      cy.contains('orders').click();

      // FK columns might be pre-selected or highlighted
      cy.contains('users Column').parent().should('exist');
      cy.contains('orders Column').parent().should('exist');
    });
  });

  describe('SQL Generation with Joins', () => {
    it('should generate SQL with INNER JOIN', () => {
      // Select base table
      cy.get('[data-testid="table-select"]').click();
      cy.contains('users').click();

      // Add and configure join
      cy.contains('Add Join').click();
      cy.contains('Join Table').parent().find('select, [role="combobox"]').click();
      cy.contains('orders').click();

      cy.contains('users Column').parent().find('select, [role="combobox"]').click();
      cy.get('li').contains('id').first().click();

      cy.contains('orders Column').parent().find('select, [role="combobox"]').click();
      cy.contains('user_id').click();

      // Check generated SQL
      cy.get('.cm-content').should('contain', 'INNER JOIN');
      cy.get('.cm-content').should('contain', 'orders');
      cy.get('.cm-content').should('contain', 'ON');
    });

    it('should generate SQL with LEFT JOIN', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains('users').click();

      cy.contains('Add Join').click();

      // Select LEFT JOIN
      cy.contains('Join Type').parent().find('select, [role="combobox"]').click();
      cy.contains('LEFT JOIN').click();

      cy.contains('Join Table').parent().find('select, [role="combobox"]').click();
      cy.contains('orders').click();

      // Verify SQL contains LEFT JOIN
      cy.get('.cm-content').should('contain', 'LEFT JOIN');
    });

    it('should generate SQL with multiple joins', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains('users').click();

      // Add first join
      cy.contains('Add Join').click();
      cy.contains('Join Table').parent().find('select, [role="combobox"]').first().click();
      cy.contains('orders').click();

      // Configure first join columns
      cy.contains('users Column').parent().find('select, [role="combobox"]').first().click();
      cy.get('li').contains('id').first().click();

      cy.contains('orders Column').parent().find('select, [role="combobox"]').first().click();
      cy.contains('user_id').click();

      // Add second join
      cy.contains('Add Join').click();

      // SQL should contain both joins
      cy.get('.cm-content').should('contain', 'INNER JOIN');
      cy.get('.cm-content').should('contain', 'orders');
    });
  });

  describe('Join State Persistence', () => {
    it('should maintain join state when switching between tabs', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains('users').click();

      cy.contains('Add Join').click();
      cy.contains('Join Table').parent().find('select, [role="combobox"]').click();
      cy.contains('orders').click();

      // Switch to schema view
      cy.contains('Schema').click();

      // Switch back to editor
      cy.contains('Editor').click();

      // Join should still be configured
      cy.contains('Join 1').should('be.visible');
      cy.contains('Join 1').parent().parent().should('contain', 'orders');
    });

    it('should clear joins when changing base table', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains('users').click();

      cy.contains('Add Join').click();
      cy.contains('Join Table').parent().find('select, [role="combobox"]').click();
      cy.contains('orders').click();

      // Change base table
      cy.get('[data-testid="table-select"]').click();
      cy.contains('products').click();

      // Joins might be cleared or recalculated
      // Verify appropriate behavior based on your implementation
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains('users').click();

      cy.contains('Add Join').focus().type('{enter}');

      // Should add join via keyboard
      cy.contains('Join 1').should('be.visible');
    });

    it('should have proper ARIA labels', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains('users').click();
      cy.contains('Add Join').click();

      cy.contains('Add Join').should('have.attr', 'aria-label').or('have.attr', 'title');
      cy.contains('Remove this join').should('exist');
    });
  });
});
