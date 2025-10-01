describe('Union Validation E2E Tests', () => {
  beforeEach(() => {
    cy.visit("/editor");
    cy.get('[data-testid="table-select"]', { timeout: 10000 }).should(
      "be.visible"
    );
  });

  describe('Union UI Components', () => {
    it("should display unions section when table is selected", () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains("users").click();
      cy.contains("Unions").should("be.visible");
    });

    it('should show "Add Union" button', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains("users").click();
      cy.contains('Add Union').should('be.visible').and('not.be.disabled');
    });

    it('should add a union clause when "Add Union" is clicked', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains('users').click();

      cy.contains("Add Union").click();
      cy.contains('Union 1').should('be.visible');
      cy.contains('Union Type').should('be.visible');
      cy.contains('Union Table').should('be.visible');
    });
  });

  describe('Union Configuration', () => {
    beforeEach(() => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains("users").click();
      cy.contains("Add Union").click();
    });

    it('should have default union type of UNION', () => {
      cy.contains('Union Type').parent().should('contain', 'UNION');
    });

    it('should allow selecting union type', () => {
      cy.contains('Union Type').parent().find('select, [role="combobox"]').click();
      cy.contains('UNION ALL').click();
      cy.contains('UNION ALL').should('be.visible');
    });

    it('should allow selecting union table', () => {
      cy.contains('Union Table').parent().find('select, [role="combobox"]').click();
      cy.contains("admins").click();
      cy.contains('admins').should('be.visible');
    });

    it('should show both union type and table selectors', () => {
      cy.contains("Union Type").should("be.visible");
      cy.contains("Union Table").should("be.visible");
    });

    it('should allow switching between UNION and UNION ALL', () => {
      cy.contains('Union Type').parent().find('select, [role="combobox"]').click();
      cy.contains('UNION ALL').click();
      cy.contains('UNION ALL').should('be.visible');

      cy.contains('Union Type').parent().find('select, [role="combobox"]').click();
      cy.contains('UNION (removes duplicates)').click();
      cy.contains('Union Type').parent().should('contain', 'UNION');
    });
  });

  describe('Multiple Unions', () => {
    it('should support adding multiple unions', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains("users").click();
      cy.contains('Add Union').click();
      cy.contains("Union 1").should("be.visible");
      cy.contains('Add Union').click();
      cy.contains("Union 2").should("be.visible");
      cy.contains('Union 1').should('be.visible');
      cy.contains('Union 2').should('be.visible');
    });

    it('should allow removing specific unions', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains("users").click();
      cy.contains('Add Union').click();
      cy.contains("Add Union").click();
      cy.contains("Union 1")
        .parent()
        .parent()
        .find('[title="Remove this union"]')
        .first()
        .click();
      cy.contains('Union 1').should('be.visible');
      cy.contains('Union 2').should('not.exist');
    });

    it('should maintain configuration when adding multiple unions', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains("users").click();
      cy.contains('Add Union').click();
      cy.contains('Union Table').parent().find('select, [role="combobox"]').first().click();
      cy.contains("admins").click();
      cy.contains("Add Union").click();
      cy.contains('Union 1').parent().parent().should('contain', 'admins');
    });

    it('should allow different union types for multiple unions', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains("users").click();
      cy.contains('Add Union').click();
      cy.contains('Union Table').parent().find('select, [role="combobox"]').first().click();
      cy.contains("admins").click();
      cy.contains('Add Union').click();
      cy.get('[data-testid="union-1"]').find('[role="combobox"]').first().click();
      cy.contains('UNION ALL').click();
      cy.get('[data-testid="union-1"]').find('select, [role="combobox"]').last().click();
      cy.contains("guests").click();
      cy.contains('Union 1').should('be.visible');
      cy.contains('Union 2').should('be.visible');
    });
  });

  describe('SQL Generation with Unions', () => {
    it("should generate SQL with UNION", () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains("users").click();
      cy.contains("Add Union").click();
      cy.contains("Union Table")
        .parent()
        .find('select, [role="combobox"]')
        .click();
      cy.contains("admins").click();
      cy.get(".cm-content").should("contain", "UNION");
      cy.get(".cm-content").should("contain", "SELECT");
      cy.get(".cm-content").should("contain", "users");
      cy.get(".cm-content").should("contain", "admins");
    });

    it('should generate SQL with UNION ALL', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains("users").click();
      cy.contains("Add Union").click();
      cy.contains('Union Type').parent().find('select, [role="combobox"]').click();
      cy.contains("UNION ALL").click();
      cy.contains('Union Table').parent().find('select, [role="combobox"]').click();
      cy.contains("admins").click();
      cy.get('.cm-content').should('contain', 'UNION ALL');
    });

    it('should generate SQL with multiple unions', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains("users").click();
      cy.contains('Add Union').click();
      cy.contains('Union Table').parent().find('select, [role="combobox"]').first().click();
      cy.contains("admins").click();
      cy.contains("Add Union").click();
      cy.get('.cm-content').should('contain', 'UNION');
      cy.get('.cm-content').should('contain', 'users');
    });

    it('should use same columns in union queries', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains("users").click();
      cy.get('[data-testid="column-select"]').click();
      cy.contains('All Columns').click(); // Deselect all
      cy.get('[data-testid="column-select"]').click();
      cy.contains('id').click();
      cy.get('[data-testid="column-select"]').click();
      cy.contains('name').click();
      cy.contains('Add Union').click();
      cy.contains('Union Table').parent().find('select, [role="combobox"]').click();
      cy.contains("admins").click();
      cy.get('.cm-content').should('contain', 'SELECT id, name FROM users');
      cy.get('.cm-content').should('contain', 'UNION SELECT id, name FROM admins');
    });

    it('should handle union with WHERE clause', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains("users").click();
      cy.contains('Column').parent().find('select, [role="combobox"]').first().click();
      cy.contains('id').first().click();
      cy.contains('Operator').parent().find('select, [role="combobox"]').click();
      cy.contains('=').first().click();
      cy.contains('Add Union').click();
      cy.contains('Union Table').parent().find('select, [role="combobox"]').click();
      cy.contains("admins").click();
      cy.get('.cm-content').should('contain', 'WHERE');
      cy.get('.cm-content').should('contain', 'UNION');
    });

    it('should handle union with ORDER BY and LIMIT', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains("users").click();
      cy.contains('Order By').parent().find('select, [role="combobox"]').first().click();
      cy.contains('name').click();
      cy.contains('Limit').parent().find('select, [role="combobox"]').click();
      cy.contains('10').click();
      cy.contains('Add Union').click();
      cy.contains('Union Table').parent().find('select, [role="combobox"]').click();
      cy.contains("admins").click();
      cy.get('.cm-content').should('contain', 'ORDER BY');
      cy.get('.cm-content').should('contain', 'LIMIT');
      cy.get('.cm-content').should('contain', 'UNION');
    });

    it('should update SQL when changing union type', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains("users").click();
      cy.contains("Add Union").click();
      cy.contains('Union Table').parent().find('select, [role="combobox"]').click();
      cy.contains("admins").click();
      cy.get('.cm-content').should('contain', 'UNION SELECT');
      cy.get('.cm-content').should('not.contain', 'UNION ALL');
      cy.contains('Union Type').parent().find('select, [role="combobox"]').click();
      cy.contains('UNION ALL').click();
      cy.get('.cm-content').should('contain', 'UNION ALL SELECT');
    });

    it('should remove union from SQL when union is removed', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains("users").click();
      cy.contains("Add Union").click();
      cy.contains('Union Table').parent().find('select, [role="combobox"]').click();
      cy.contains("admins").click();
      cy.get('.cm-content').should('contain', 'UNION');
      cy.contains("Union 1")
        .parent()
        .parent()
        .find('[title="Remove this union"]')
        .click();
      cy.get('.cm-content').should('not.contain', 'UNION');
      cy.get('.cm-content').should('not.contain', 'admins');
    });
  });

  describe('Union Validation Feedback', () => {
    it('should not show current table in union table options', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains('users').click();
      cy.contains("Add Union").click();
      cy.contains("Union Table")
        .parent()
        .find('select, [role="combobox"]')
        .click();
      cy.contains("admins").should("be.visible");
      cy.get('[role="option"]').contains('users').should('not.exist');
    });

    it('should allow clearing union table selection', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains('users').click();
      cy.contains("Add Union").click();
      cy.contains("Union Table")
        .parent()
        .find('select, [role="combobox"]')
        .click();
      cy.contains("admins").click();
      cy.contains("Union Table")
        .parent()
        .find('[aria-label="Clear value"]')
        .click();

      cy.get('.cm-content').should('not.contain', 'admins');
    });
  });

  describe('Union State Persistence', () => {
    it('should maintain union state when switching between tabs', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains("users").click();
      cy.contains('Add Union').click();
      cy.contains('Union Table').parent().find('select, [role="combobox"]').click();
      cy.contains("admins").click();
      cy.contains("Schema").click();
      cy.contains("Editor").click();
      cy.contains('Union 1').should('be.visible');
      cy.contains('Union 1').parent().parent().should('contain', 'admins');
    });

    it('should clear unions when changing base table', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains("users").click();
      cy.contains('Add Union').click();
      cy.contains('Union Table').parent().find('select, [role="combobox"]').click();
      cy.contains("admins").click();
      cy.get('[data-testid="table-select"]').click();
      cy.contains("products").click();
    });
  });

  describe('Advanced Union Scenarios', () => {
    it('should handle unions combined with joins', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains("users").click();
      cy.contains("Add Join").click();
      cy.contains('Join Table').parent().find('select, [role="combobox"]').click();
      cy.contains("orders").click();
      cy.contains("Add Union").click();
      cy.contains('Union Table').parent().find('select, [role="combobox"]').click();
      cy.contains("admins").click();
      cy.get('.cm-content').should('contain', 'JOIN');
      cy.get('.cm-content').should('contain', 'UNION');
    });

    it('should display correct count badge for unions', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains("users").click();
      cy.contains("Add Union").click();
      cy.contains("Add Union").click();
      cy.contains("Advanced").parent().should('contain', '2');
    });

    it('should handle DISTINCT with unions', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains("users").click();
      cy.get('[type="checkbox"]').check();
      cy.contains("Add Union").click();
      cy.contains('Union Table').parent().find('select, [role="combobox"]').click();
      cy.contains("admins").click();
      cy.get('.cm-content').should('contain', 'DISTINCT');
      cy.get('.cm-content').should('contain', 'UNION');
    });
  });

  describe('Accessibility', () => {
    it("should be keyboard navigable", () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains("users").click();
      cy.contains("Add Union").focus().type("{enter}");
      cy.contains("Union 1").should("be.visible");
    });
    it("should have proper ARIA labels", () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains("users").click();
      cy.contains("Add Union").click();
      cy.contains("Add Union").should("exist");
      cy.contains("Remove this union").should("exist");
    });
    it("should have clear labels for union controls", () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains("users").click();
      cy.contains("Add Union").click();
      cy.contains("Union Type").should("be.visible");
      cy.contains("Union Table").should("be.visible");
      cy.contains("Union 1").should("be.visible");
    });
  });

  describe('Error Handling', () => {
    it('should handle disabled state when no table selected', () => {
      cy.contains('Add Union').should('be.disabled');
    });
    it('should enable union button after table selection', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains("users").click();
      cy.contains('Add Union').should('not.be.disabled');
    });
    it('should handle removing all unions', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains("users").click();
      cy.contains('Add Union').click();
      cy.contains('Union Table').parent().find('select, [role="combobox"]').click();
      cy.contains("admins").click();
      cy.get('.cm-content').should('contain', 'UNION');
      cy.contains("Union 1")
        .parent()
        .parent()
        .find('[title="Remove this union"]')
        .click();
      cy.contains('Union 1').should('not.exist');
      cy.get('.cm-content').should('not.contain', 'UNION');
    });
  });
});
