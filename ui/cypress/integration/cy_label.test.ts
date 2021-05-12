describe('Navigate', () => {
  beforeEach(() => {
    cy.visit('http://localhost:8888/')
    cy.clickNav(3,'Explore')
  })

  it('_start and _stop display', () => {
    cy.get('[data-test=source-button-selector] > .radio-buttons').contains('Flux').click({force: true})
    cy.get('[data-test=flux-schema-flux-schema-tree]').click({ multiple: true })
    cy.get('[data-test=flux-schema-children-item-group]')
      .should('be.visible', 'Tags')
      .click({ multiple: true })
      .contains('_start')
      .should('not.exist')
      cy.get('[data-test=flux-schema-children-item-group]')
      .should('be.visible', 'Tags')
      .click({ multiple: true })
      .contains('_stop')
      .should('not.exist')
  })

})
