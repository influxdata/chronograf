import { delay } from "cypress/types/bluebird"

describe('variables', () => {
  beforeEach(cy.setupConnection)
  
  it('create dashboard', () => {
    cy.visit('http://localhost:8888/')
    cy.clickNav(4, 'Dashboards')
    cy.getByTitle('Create Dashboard')
      .click()
    cy.get('[data-test=rename-dashboard]')
      .click()
      .clear()
      .type('testing_dashboard{enter}')
    
    cy.clickNav(3, 'Explore')
    cy.get('[data-test=source-button-selector] > .dropdown > .dropdown--button')
      .click()
      cy.get('[data-test="dropdown--item"]')
      .each(($el, index, $list) => {
        if($el.text() == 'Influx 2'){
          $el.click()}
    })
    cy.getByTitle('Flux').click()
    cy.writeManualData('new_data', 'value=2')
    cy.writeManualData('new_data', 'value=2.5')
    cy.writeManualData('new_data', 'value=5.8')
    cy.writeManualData('new_data', 'value=3.7')

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

    cy.get('[data-test="send-to-dashboard-btn"]').click()
    cy.get('.form--wrapper > :nth-child(1) > .dropdown > [data-test=wizard-bucket-selected]')
      .click()
    
    //selecting dynamic dropdown
    cy.get('[data-test="dropdown--item"]')
      .each(($el, index, $list) => {
        if($el.text() == 'testing_dashboard'){
          $el.click()}
        })
    
    cy.get('.form--wrapper > :nth-child(1) > .dropdown > [data-test=wizard-bucket-selected]')
    .click()
    cy.get('.form--wrapper > :nth-child(1) > .dropdown > [data-test=wizard-bucket-selected]')
    .should('include.text', 'testing_dashboard')

    cy.get('[data-test="input-field"]')
        .eq(0)
      .type('testing_simple_data')
    cy.getByTitle('Must choose at least 1 dashboard and set a name').click()
  })

  it('create and delete variables', () => {
    cy.clickNav(4, 'Dashboards')
    cy.get(':nth-child(1) > :nth-child(1) > a').click()
    cy.getByTitle('Show Template Variables Controls').click()
    cy.get('[data-test=add-template-variable]').click()
    cy.get(':nth-child(1) > .dropdown > [data-test=wizard-bucket-selected]').click()

    cy.get('[data-test="dropdown--item"]')
      .each(($el, index, $list) => {
        if($el.text() == 'Influx 2'){
          $el.click()}
        })

    cy.get('[data-test="dropdown-toggle"]')
      .filter(':visible')
      .click({force: true})

    cy.get('[data-test=dropdown-ul] > .fancy-scroll--container > .fancy-scroll--view > :nth-child(8) > a').click()
    //.contains('InfluxQL Meta Query').should('exist').click()
    
    
    cy.wait(2000)
    cy.get('[data-test=variable-name-type]').type('iHopeThisNameDoesNotExist')
    cy.wait(2500)
    cy.get('[data-test="btn-accept"]').click()
    cy.wait(2500)

    cy.get('[data-test=add-template-variable]').click()
    cy.get(':nth-child(1) > .dropdown > .dropdown--button').click()
    cy.get('[data-test="dropdown--item"]')
      .each(($el, index, $list) => {
        if($el.text() == 'Influx 2'){
          $el.click()}
        })

    cy.get(':nth-child(3) > [data-test=dropdown-toggle] > .btn > .dropdown-selected').click()
    cy.get('[data-test="dropdown-ul"]')
      .each(($el, index, $list) => {
        if($el.text() == 'Flux Query'){
          $el.click()}
        })

    cy.get('[data-test=variable-name-type]').type('{selectAll}{backspace}iHopeThisNameDoesNotExist22')
    cy.get('[data-test="btn-accept"]').click()   
    cy.get('.template-control--container').contains('iHopeThisNameDoesNotExist')
    
    cy.get('[data-test=add-template-variable]').click()
    cy.get('[data-test=variable-name-type]')
      .clear()
      .type('iHopeThisNameDoesNotExist',{delay:400})
    cy.get('[data-test=btn-accept]').should('be.disabled')
    cy.get('[data-test=btn-cancel]').click()


    //deletes existing variable
    cy.getByTestID('edit')
      .first()
      .click()
    cy.getByTitle('Confirm').click()
    cy.getByTestID('confirm-btn').click()

    cy.getByTestID('edit')
      // .first()
      .click()
    cy.getByTitle('Confirm').click()
    cy.getByTestID('confirm-btn').click()

    cy.get('.template-control--dropdown').should('not.exist')
    cy.get('[data-test="empty-state"]').should('exist')

  })
})
