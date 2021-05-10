describe('Navigate', () => {
  beforeEach(() => {
    cy.visit('http://localhost:8888/')
    cy.clickNav(3,'Explore')
  })

  it('_start and _stop display', () => {
    cy.getByTestID('source-button-selector').contains('Flux').click({force: true})
    cy.getByTestID('flux-schema-flux-schema-tree').click({ multiple: true })
    cy.getByTestID('flux-schema-children-item-group')
      .should('be.visible', 'Tags')
      .click({ multiple: true })
      .contains('_start')
      .should('not.exist')
    cy.getByTestID('flux-schema-children-item-group')
      .should('be.visible', 'Tags')
      .click({ multiple: true })
      .contains('_stop')
      .should('not.exist')
  })

})
