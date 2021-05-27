describe('Navigate', () => {
  beforeEach(() => {
    cy.visit('http://localhost:8888/')
    cy.clickNav(3,'Explore')
  })

  it('_start and _stop display', () => {
    cy.get('[data-test=source-button-selector] > .dropdown > .dropdown--button').click()
    cy.get(':nth-child(1) > .dropdown-item--children').should('include.text', 'InfluxTest2').click()
    cy.get('[data-test=source-button-selector] > .radio-buttons').contains('Flux').click({force: true})
    cy.get('[data-test=flux-schema-flux-schema-tree]').click({multiple: true})
    cy.get('[data-test="schema-category-field"]')
      .get('[data-test="schema-category-item"]').click({multiple: true})
    cy.get('[data-test="schema-category-field"]').children()
      .contains('_start')
      .should('not.exist')
    cy.get('[data-test="schema-category-field"]').children()
      .contains('_stop')
      .should('not.exist')
  })
})