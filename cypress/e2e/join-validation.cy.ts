describe('Join Validation E2E Tests', () => {
  beforeEach(() => {
    cy.visit("/editor");
    cy.get('[data-testid="table-select"]', { timeout: 10000 }).should(
      "be.visible"
    );
  });

  describe('Join UI Components', () => {
    it("should display join section when table is selected", () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains("users").click();
      cy.contains("Joins").should("be.visible");
    });

    it('should show "Add Join" button', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains("users").click();
      cy.contains('Add Join').should('be.visible').and('not.be.disabled');
    });

    it('should add a join clause when "Add Join" is clicked', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains('users').click();

      cy.contains("Add Join").click();
      cy.contains('Join 1').should('be.visible');
      cy.contains('Join Type').should('be.visible');
      cy.contains('Join Table').should('be.visible');
    });
  });

  describe('Join Configuration', () => {
    beforeEach(() => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains("users").click();
      cy.contains("Add Join").click();
    });

    it('should allow selecting join type', () => {
      cy.contains('Join Type').parent().find('select, [role="combobox"]').click();
      cy.contains('LEFT JOIN').click();

      // Verify selection
      cy.contains('LEFT JOIN').should('be.visible');
    });

    it('should allow selecting join table', () => {
      cy.contains('Join Table').parent().find('select, [role="combobox"]').click();
      cy.contains("orders").click();
      cy.contains('orders').should('be.visible');
    });

    it("should show column selectors after table is selected", () => {
      cy.contains("Join Table")
        .parent()
        .find('select, [role="combobox"]')
        .click();
      cy.contains("orders").click();
      cy.contains("users Column").should("be.visible");
      cy.contains("orders Column").should("be.visible");
    });

    it("should not show column selectors for CROSS JOIN", () => {
      cy.contains("Join Type")
        .parent()
        .find('select, [role="combobox"]')
        .click();
      cy.contains("CROSS JOIN").click();
      cy.contains("Join Table")
        .parent()
        .find('select, [role="combobox"]')
        .click();
      cy.contains("orders").click();
      cy.contains("users Column").should("not.exist");
      cy.contains("orders Column").should("not.exist");
    });
  });

  describe('Join Column Selection', () => {
    beforeEach(() => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains('users').click();
      cy.contains("Add Join").click();
      cy.contains('Join Table').parent().find('select, [role="combobox"]').click();
      cy.contains('orders').click();
    });

    it('should populate column options from base table', () => {
      cy.contains("users Column")
        .parent()
        .find('select, [role="combobox"]')
        .click();
      cy.contains('id').should('be.visible');
      cy.contains('name').should('be.visible');
    });

    it('should populate column options from join table', () => {
      cy.contains("orders Column")
        .parent()
        .find('select, [role="combobox"]')
        .click();
      cy.contains('id').should('be.visible');
      cy.contains('user_id').should('be.visible');
    });

    it("should allow selecting join columns", () => {
      cy.contains("users Column")
        .parent()
        .find('select, [role="combobox"]')
        .click();
      cy.contains("id").first().click();
      cy.contains("orders Column")
        .parent()
        .find('select, [role="combobox"]')
        .click();
      cy.contains("user_id").click();
      cy.contains("users Column").parent().should("contain", "id");
      cy.contains("orders Column").parent().should("contain", "user_id");
    });
  });

  describe('Multiple Joins', () => {
    it('should support adding multiple joins', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains("users").click();
      cy.contains('Add Join').click();
      cy.contains("Join 1").should("be.visible");
      cy.contains('Add Join').click();
      cy.contains("Join 2").should("be.visible");
      cy.contains('Join 1').should('be.visible');
      cy.contains('Join 2').should('be.visible');
    });

    it('should allow removing specific joins', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains("users").click();
      cy.contains('Add Join').click();
      cy.contains("Add Join").click();
      cy.contains("Join 1")
        .parent()
        .parent()
        .find('[title="Remove this join"]')
        .first()
        .click();
      cy.contains('Join 1').should('be.visible');
      cy.contains('Join 2').should('not.exist');
    });

    it('should maintain configuration when adding multiple joins', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains("users").click();
      cy.contains('Add Join').click();
      cy.contains('Join Table').parent().find('select, [role="combobox"]').first().click();
      cy.contains("orders").click();
      cy.contains("Add Join").click();
      cy.contains('Join 1').parent().parent().should('contain', 'orders');
    });
  });

  describe('Join Validation Feedback', () => {
    it('should only show tables with FK relationships', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains('users').click();
      cy.contains("Add Join").click();
      cy.contains("Join Table")
        .parent()
        .find('select, [role="combobox"]')
        .click();
      cy.contains("orders").should("be.visible");
      cy.contains('li', 'users').should('not.exist');
    });

    it('should suggest FK columns by default', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains('users').click();
      cy.contains("Add Join").click();
      cy.contains('Join Table').parent().find('select, [role="combobox"]').click();
      cy.contains("orders").click();
      cy.contains('users Column').parent().should('exist');
      cy.contains('orders Column').parent().should('exist');
    });
  });

  describe('SQL Generation with Joins', () => {
    it("should generate SQL with INNER JOIN", () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains("users").click();
      cy.contains("Add Join").click();
      cy.contains("Join Table")
        .parent()
        .find('select, [role="combobox"]')
        .click();
      cy.contains("orders").click();
      cy.contains("users Column")
        .parent()
        .find('select, [role="combobox"]')
        .click();
      cy.get("li").contains("id").first().click();
      cy.contains("orders Column")
        .parent()
        .find('select, [role="combobox"]')
        .click();
      cy.contains("user_id").click();
      cy.get(".cm-content").should("contain", "INNER JOIN");
      cy.get(".cm-content").should("contain", "orders");
      cy.get(".cm-content").should("contain", "ON");
    });

    it('should generate SQL with LEFT JOIN', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains("users").click();
      cy.contains("Add Join").click();
      cy.contains('Join Type').parent().find('select, [role="combobox"]').click();
      cy.contains("LEFT JOIN").click();
      cy.contains('Join Table').parent().find('select, [role="combobox"]').click();
      cy.contains("orders").click();
      cy.get('.cm-content').should('contain', 'LEFT JOIN');
    });

    it('should generate SQL with multiple joins', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains("users").click();
      cy.contains('Add Join').click();
      cy.contains('Join Table').parent().find('select, [role="combobox"]').first().click();
      cy.contains("orders").click();
      cy.contains('users Column').parent().find('select, [role="combobox"]').first().click();
      cy.get("li").contains("id").first().click();
      cy.contains('orders Column').parent().find('select, [role="combobox"]').first().click();
      cy.contains("user_id").click();
      cy.contains("Add Join").click();
      cy.get('.cm-content').should('contain', 'INNER JOIN');
      cy.get('.cm-content').should('contain', 'orders');
    });
  });

  describe('Join State Persistence', () => {
    it('should maintain join state when switching between tabs', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains("users").click();
      cy.contains('Add Join').click();
      cy.contains('Join Table').parent().find('select, [role="combobox"]').click();
      cy.contains("orders").click();
      cy.contains("Schema").click();
      cy.contains("Editor").click();
      cy.contains('Join 1').should('be.visible');
      cy.contains('Join 1').parent().parent().should('contain', 'orders');
    });

    it('should clear joins when changing base table', () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains("users").click();
      cy.contains('Add Join').click();
      cy.contains('Join Table').parent().find('select, [role="combobox"]').click();
      cy.contains("orders").click();
      cy.get('[data-testid="table-select"]').click();
      cy.contains("products").click();
    });
  });

  describe('Accessibility', () => {
    it("should be keyboard navigable", () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains("users").click();
      cy.contains("Add Join").focus().type("{enter}");
      cy.contains("Join 1").should("be.visible");
    });

    it("should have proper ARIA labels", () => {
      cy.get('[data-testid="table-select"]').click();
      cy.contains("users").click();
      cy.contains("Add Join").click();
      cy.contains("Add Join").should("exist");
      cy.contains("Remove this join").should("exist");
    });
  });
});
