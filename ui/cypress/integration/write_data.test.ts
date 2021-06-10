function writeManualData(fieldKey: string,
                        dataValue: string,
){
  cy.get('[data-test=write-data-button]').click()
  cy.get('[data-test=dropdown-toggle]')
  .first()
  .click({multiple: true})

  cy.get('[data-test="dropdown-item"]')
  .filter(':contains("_tasks")')
  .click()

  cy.getByTitle('Write data manually using Line Protocol')
    .click()
  cy.get('[data-test=manual-entry-field]')
    .clear()
    .type(fieldKey+" "+dataValue)
  cy.get('[data-test="write-data-submit-button"]').click()
  cy.wait(200)
}

describe('write data testing', () => {
  beforeEach(cy.setupConnection)

  it('write data manual', () => {
    cy.clickNav(3, 'Explore')
    cy.get('[data-test=source-button-selector] > .dropdown > .dropdown--button')
      .click()
    cy.get('[data-test=dropdown--item]')
      .filter(':contains("InfluxTest2")')
      .click()
    cy.getByTitle('Flux').click()

    writeManualData('new_data', 'value=2')
    writeManualData('new_data', 'value=2.5')
    writeManualData('new_data', 'value=5.8')
    writeManualData('new_data', 'value=3.7')
    writeManualData('new_data', 'value=4.5')

    cy.get('[data-test=threesizer-header-controls] > .button-default').click('left')
    cy.get('.form--wrapper > :nth-child(1) > .dropdown > [data-test=wizard-bucket-selected]')
    .click()
  
    cy.get('[data-test="dropdown--item"]')
    .filter(':contains("_tasks")')
    .click()
    cy.get(':nth-child(2) > .dropdown > [data-test=wizard-bucket-selected]')
    .click()
    .filter(':contains("new_data")').click()
    cy.get('.form--submit > .button').click()
    cy.get('.button-primary').click()

    cy.get('[data-test="page-header--center"]').click('right')
    cy.get('#Table').click()

    cy.get('[data-test="table-graph"]').contains('2.5')
    cy.get('[data-test="table-graph"]').contains('5.8')

  })
})
