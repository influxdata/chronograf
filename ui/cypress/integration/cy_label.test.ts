describe.only('Navigate', () => {
  beforeEach(cy.setupConnection)

  it('_start and _stop display', () => {
    cy.clickNav(3, 'Explore')
    cy.get('[data-test=source-button-selector] > .dropdown > [data-test=wizard-bucket-selected]')
      .click()
    // selecting dynamic dropdown item
    cy.get('[data-test="dropdown--item"]')
      .each(($el, index, $list) => {
        if($el.text() == 'InfluxTest2'){
          $el.click()}
      })
    //cy.get(':nth-child(1) > .dropdown-item--children').should('include.text', 'InfluxTest2').click()
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