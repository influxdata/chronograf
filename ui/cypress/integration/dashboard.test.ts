describe('dashboards', () => {
  beforeEach(() => {
    cy.deleteDashboards()
    cy.cutConnections()
    cy.createConnection()
    cy.get('@connections').then(connections => {
      cy.fixture('routes').then(({dashboards}) => {
        cy.visit(`/sources/${connections[0].id}${dashboards}`)
      })
    })
  })

  it('create, rename and delete a dashboard', () => {
    // create a dashboard
    cy.get('button').contains('Create Dashboard').click()

    const newName = 'DashboardQA'

    // rename the dashboard
    cy.get('.rename-dashboard')
      .should('have.text', 'Name This Dashboard')
      .type(`${newName}{enter}`)
      .should('have.text', newName)

    // delete the dashboard
    cy.get('@connections').then(connections => {
      cy.fixture('routes').then(({dashboards}) => {
        cy.visit(`/sources/${connections[0].id}${dashboards}`)
      })
    })

    // DOM Element where the dashboard resides
    cy.get('.panel-body > table > tbody')
      .should('exist')
      .within(() => {
        // delete button
        cy.get('.confirm-button--confirmation').click({force: true})
      })
      .should('not.exist')
  })
})

// TODO: has to be rewritten and sorted into multiple files as it does much more than the test description says (creates flux Query)
// describe('variables', () => {
//   beforeEach(cy.setupConnection)

//   it('create dashboard', () => {
//     cy.visit('/')
//     cy.clickNav(4, 'Dashboards')
//     cy.getByTitle('Create Dashboard')
//       .click()
//     cy.getByTestID('rename-dashboard')
//       .type('testing_dashboard{enter}')

//     cy.clickNav(3, 'Explore')
//     cy.get('[data-test=source-button-selector] > .dropdown > .dropdown--button')
//       .click()
//       cy.get('[data-test="dropdown--item"]')
//       .each(($el, index, $list) => {
//         if($el.text() == 'InfluxTest2'){
//           $el.click()}
//     })
//     cy.getByTitle('Flux').click()
//     cy.writeManualData('new_data', 'value=2')
//     cy.writeManualData('new_data', 'value=2.5')
//     cy.writeManualData('new_data', 'value=5.8')
//     cy.writeManualData('new_data', 'value=3.7')

//     cy.get('[data-test=threesizer-header-controls] > .button-default').click('left')
//     cy.get('.form--wrapper > :nth-child(1) > .dropdown > [data-test=wizard-bucket-selected]')
//     .click()

//     cy.get('[data-test="dropdown--item"]')
//     .filter(':contains("my-bucket")')
//     .click()
//     cy.get(':nth-child(2) > .dropdown > [data-test=wizard-bucket-selected]')
//     .click()
//     .filter(':contains("new_data")').click()
//     cy.get('.form--submit > .button').click()

//     cy.get('[data-test="send-to-dashboard-btn"]').click()
//     cy.get('.form--wrapper > :nth-child(1) > .dropdown > [data-test=wizard-bucket-selected]')
//       .click()

//     //selecting dynamic dropdown
//     cy.get('[data-test="dropdown--item"]').contains('testing_dashboard').then(()=>
//         cy.get('[data-test="dropdown--item"]')
//           .each(($el, index, $list) => {
//             if($el.text() == 'testing_dashboard'){
//               $el.click()}
//             }
//           ))

//     cy.get('.form--wrapper > :nth-child(1) > .dropdown > [data-test=wizard-bucket-selected]')
//     .click()
//     cy.get('.form--wrapper > :nth-child(1) > .dropdown > [data-test=wizard-bucket-selected]')
//     .should('include.text', 'testing_dashboard')

//     cy.getByTestID('input-field')
//         .eq(0)
//       .type('testing_simple_data')
//     cy.getByTitle('Must choose at least 1 dashboard and set a name').click()
//   })

//   it('create and delete variables', () => {
//     cy.clickNav(4, 'Dashboards')
//     cy.get('h2', {timeout: 10000}).should('be.visible')
//     cy.get('h2',).then($a => {
//       cy.wrap($a)
//       if ($a.text().includes('0 Dashboards')) {
//         cy.get('h4').then($b => {
//           cy.wrap($b)
//           cy.getByTitle('Create Dashboard').click()
//         })

//       }
//       else{
//         cy.getByTitle('Confirm')
//           .click({multiple: true, force:true})
//           .then(()=>
//             cy.getByTestID('confirm-btn')
//               .click({multiple: true, force:true}))
//               .then(()=>
//                 cy.getByTitle('Create Dashboard').click({force: true})
//         )}
//     })

//     cy.getByTitle('Show Template Variables Controls').click()
//     cy.get('[data-test=add-template-variable]').click({force: true})
//     cy.get(':nth-child(1) > .dropdown > [data-test=wizard-bucket-selected]').click()

//     cy.getByTestID('dropdown--item')
//       .each(($el, index, $list) => {
//         if($el.text() == 'InfluxTest2'){
//           $el.click()}
//         })

//     cy.get(':nth-child(3) > [data-test=dropdown-toggle] > .btn > .dropdown-selected')
//       .filter(':visible')
//       .click()

//     cy.get('[data-test=dropdown-ul] > .fancy-scroll--container > .fancy-scroll--view > :nth-child(8) > a').click()

//     cy.wait(2000)
//     cy.getByTestID('variable-name-type', {timeout: 2000})
//       .clear()
//       .type('iHopeThisNameDoesNotExist', {delay:200})

//     cy.getByTestID('btn-accept').click()
//     cy.wait(2500)

//     cy.getByTestID('add-template-variable').click()
//     cy.get(':nth-child(1) > .dropdown > .dropdown--button').click()
//     cy.getByTestID('dropdown--item')
//       .each(($el, index, $list) => {
//         if($el.text() == 'InfluxTest2'){
//           $el.click()}
//         })

//     cy.get(':nth-child(3) > [data-test=dropdown-toggle] > .btn > .dropdown-selected').click()
//     cy.getByTestID('dropdown-ul')
//       .each(($el, index, $list) => {
//         if($el.text() == 'Flux Query'){
//           $el.click()}
//         })
//     cy.getByTestID('variable-name-type', {timeout: 2000})
//       .type('{selectAll}{backspace}iHopeThisNameDoesNotExist22' , {delay:600})

//     cy.getByTestID('btn-accept').click()
//     cy.get('.template-control--container').contains('iHopeThisNameDoesNotExist')

//    cy.getByTestID('add-template-variable').click()
//    cy.getByTestID('variable-name-type', {timeout: 2000})
//      .type('{selectAll}{backspace}iHopeThisNameDoesNotExist',{delay:400})

//    cy.getByTestID('btn-accept').should('be.disabled')
//    cy.getByTestID('btn-cancel').click()

//    deletes existing variable
//    cy.getByTestID('edit')
//      .last()
//      .click()
//    cy.getByTitle('Confirm').click()
//    cy.getByTestID('confirm-btn').click()
//    cy.wait(500)
//    cy.getByTestID('edit').then($a => {
//      cy.wrap($a)
//      .first()
//      .click({ force: true })})
//    cy.getByTitle('Confirm').click()
//    cy.getByTestID('confirm-btn').click()

//    cy.get('.template-control--dropdown').should('not.exist')
//    cy.get('[data-test="empty-state"]').should('exist')

//    cy.clickNav(4, 'Dashboards')
//    cy.getByTitle('Confirm').click({multiple: true, force:true}).then(()=>
//    cy.getByTestID('confirm-btn').click({multiple: true, force:true}))
//  })
// })
