//TODO: rewrite as most of the code can be simpler, also uses already deleted functions from commands.ts

// describe('Navigate', () => {
//   beforeEach(cy.setupConnection)

//   it('_start and _stop display', () => {
//     cy.clickNav(3, 'Explore')
//     cy.get('[data-test=source-button-selector] > .dropdown > [data-test=wizard-bucket-selected]')
//       .click()
//     // selecting dynamic dropdown item
//     cy.get('[data-test="dropdown--item"]')
//       .each(($el, index, $list) => {
//         if($el.text() == 'InfluxTest2'){
//           $el.click()}
//       })

//     cy.get('[data-test=source-button-selector] > .radio-buttons')
//       .contains('Flux')
//       .click({force: true})
//     // cy.get('[data-test=flux-schema-flux-schema-tree]').click({multiple: true})
//     cy.getByTestID('flux-schema--expander').click({multiple: true})
//     cy.getByTestID('schema-category-field')
//       .getByTestID('schema-category-item')
//       .click({multiple: true})
//     cy.getByTestID('schema-category-field')
//       .children()
//       .contains('_start')
//       .should('not.exist')
//     cy.get('[data-test="schema-category-field"]')
//       .children()
//       .contains('_stop')
//       .should('not.exist')
//   })

//   it('write data manual', () => {
//     cy.clickNav(3, 'Explore')
//     cy.get('[data-test=source-button-selector] > .dropdown > .dropdown--button')
//       .click()
//     cy.get('[data-test=dropdown--item]')
//       .filter(':contains("InfluxTest2")')
//       .click()
//     cy.getByTitle('Flux').click()

//     cy.writeManualData('new_data', 'value=2')
//     cy.writeManualData('new_data', 'value=2.50')
//     cy.writeManualData('new_data', 'value=5.8')
//     cy.writeManualData('new_data', 'value=3.7')
//     cy.writeManualData('new_data', 'value=4.5')

//     cy.get('[data-test=threesizer-header-controls] > .button-default').click('left')
//     cy.get('.form--wrapper > :nth-child(1) > .dropdown > [data-test=wizard-bucket-selected]')
//       .click()

//     cy.get('[data-test="dropdown--item"]')
//       .filter(':contains("my-bucket")')
//       .click()
//     cy.get(':nth-child(2) > .dropdown > [data-test=wizard-bucket-selected]')
//       .click()
//       .filter(':contains("new_data")').click()
//     cy.get('.form--submit > .button').click()
//     cy.get('.button-primary').click()

//     cy.get('[data-test="page-header--center"]').click('right')
//     cy.get('#Table').click()

//     cy.get('[data-test="table-graph"]').contains('2.5')
//     cy.get('[data-test="table-graph"]').contains('5.8')
//   })

// it('default connetion to influxdb v2', ()=> {
//   cy.clickNav(8, 'Configuration')
//   cy.get('h1')
//   cy.getByTestID('set-conection-panel-body').contains('InfluxTest2 (Default)')
//   })

//   it('add data to explore', () => {
//     cy.clickNav(3, 'Explore')
//     cy.get('[data-test=source-button-selector] > .dropdown > [data-test=wizard-bucket-selected]')
//       .click()
//     // selecting dynamic dropdown item
//     cy.get('[data-test="dropdown--item"]')
//       .each(($el, index, $list) => {
//         if($el.text() == 'InfluxTest2'){
//           $el.click()
//         }
//       })

//     cy.getByTitle('Flux').click()
//     cy.writeManualData('new_data', 'value=2')
//     cy.writeManualData('new_data', 'value=2.5')
//     cy.writeManualData('new_data', 'value=5.8')
//     cy.writeManualData('new_data', 'value=3.7')
//     cy.writeManualData('new_data', 'value=5')
//     cy.writeManualData('new_data', 'value=2.5')
//     cy.writeManualData('new_data', 'value=5.8')
//     cy.writeManualData('new_data', 'value=3.7')

//     cy.clickNav(4, 'Dashboards')
//     cy.getByTitle('Create Dashboard').click()
//     cy.getByTestID('rename-dashboard')
//     // .clear()
//       .type('explorer_test{enter}')
//     cy.getByTestID('add-data-btn').click()

//     cy.get('[data-test=source-button-selector] > .dropdown > [data-test=wizard-bucket-selected]')
//       .click()

//       // selecting dynamic dropdown item
//     cy.get('[data-test="dropdown--item"]')
//       .each(($el, index, $list) => {
//         if($el.text() == 'InfluxTest2'){
//           $el.click()
//         }
//       })

//     cy.getByTitle('Flux').click()
//     cy.getByTitle('Script Wizard')
//   })

//   it('create data queries in data explore',() =>{
//     cy.visit('/')
//     cy.clickNav(4, 'Dashboards')
//     cy.getByTitle('Create Dashboard').click()
//     cy.getByTestID('rename-dashboard')
//       .click()
//       .type('explorer_test{enter}')
//     cy.getByTestID('add-data-btn').click()

//     cy.get('[data-test=source-button-selector] > .dropdown > [data-test=wizard-bucket-selected]')
//         .click()

//     // selecting dynamic dropdown item
//     cy.get('[data-test="dropdown--item"]')
//         .each(($el, index, $list) => {
//           if($el.text() == 'InfluxTest2'){
//             $el.click()}})

//     cy.getByTitle('Flux').click()

//     cy.getByTitle('Script Wizard').click()
//     cy.get('.form--wrapper > :nth-child(1) > .dropdown > [data-test=wizard-bucket-selected]')
//       .click()

//     cy.getByTestID('dropdown--item')
//       .filter(':contains("my-bucket")')
//       .click()
//     cy.get(':nth-child(2) > .dropdown > [data-test=wizard-bucket-selected]')
//       .click()
//       .filter(':contains("new_data")').click()
//     cy.get('.form--submit > .button').click()

//     cy.getByTestID('rename-graph')
//       .click()
//       .clear()
//       .type('Stacked line', {delay:100})

//     cy. getByTitle('Visualization').click()
//     cy.get('#StepPlot').click()
//     cy.getByTestID('line-colours').click()
//     cy.get('.color-dropdown--menu > .fancy-scroll--container > .fancy-scroll--view > :nth-child(5)')
//       .click()

//     cy.get('#SingleStat').click()
//     cy.getByTestID('graph-container')
//       .wait(500)

//     cy.get('.color-dropdown > .btn').click()
//     cy.getByTestID('base-colour')
//       .each(($el: { text: () => string; click: () => void }, index: any, $list: any) => {
//         if($el.text() == 'Thunder'){
//           $el.click()}})

//     cy.get(':nth-child(1) > .form-control').type('Amos ')
//     // edit graph
//     cy.getByTitle('Save').click()

//     cy.clickNav(4, 'Dashboards')
//     cy.getByTitle('Confirm').click({multiple :true, force: true})
//     cy.getByTestID('confirm-btn').click({multiple: true, force:true})
//   })
//   it('snapshot',() =>{
//     cy.clickNav(3, 'Explore')

//     cy.get('[data-test=source-button-selector] > .dropdown > [data-test=wizard-bucket-selected]')
//       .click()
//     // selecting dynamic dropdown item
//     cy.get('[data-test="dropdown--item"]')
//       .each(($el, index, $list) => {
//         if($el.text() == 'InfluxTest2'){
//           $el.click()}
//     })

//     cy.getByTitle('Flux').click()
//     cy.writeManualData('testing_value', 'value=0')

//     cy.get('[data-test=source-button-selector] > .dropdown > [data-test=wizard-bucket-selected]')
//       .click()

//     // selecting dynamic dropdown item
//     cy.clickNav(4, 'Dashboards')
//     cy.getByTitle('Create Dashboard').click()
//     cy.getByTestID('rename-dashboard').click().type('explorer_test{enter}')
//     cy.getByTestID('add-data-btn').click()

//     cy.get('[data-test=source-button-selector] > .dropdown > [data-test=wizard-bucket-selected]')
//     .click()

//     // selecting dynamic dropdown item
//     cy.get('[data-test="dropdown--item"]')
//       .each(($el, index, $list) => {
//         if($el.text() == 'InfluxTest2'){
//           $el.click()}})

//     cy.getByTitle('Flux').click()

//     cy.getByTitle('Script Wizard').click()
//     cy.get('.form--wrapper > :nth-child(1) > .dropdown > [data-test=wizard-bucket-selected]').click()

//     cy.getByTestID('dropdown--item')
//       .filter(':contains("my-bucket")')
//       .click()
//     cy.get(':nth-child(2) > .dropdown > [data-test=wizard-bucket-selected]')
//         .click()
//     /*.filter(':contains("testing_value")').click()*/
//     cy.get('[data-test="dropdown--item"]')
//       .each(($el, index, $list) => {
//         if($el.text() == 'testing_value'){
//           $el.click()}})
//     cy.get('.form--submit > .button').click()

//     cy. getByTitle('Visualization').click()
//     cy.get('#SingleStat').click()
//     cy.getByTestID('graph-container')
//       .wait(500)

//     cy.getByTestID('graph-container')
//       .matchImageSnapshot('singleNumber')

//     //  edit graph
//     cy.getByTitle('Save').click()

//     cy.get('.dash-graph--container').wait(1500)
//     cy.get('.dash-graph--container')
//       .matchImageSnapshot('dashboardSingleNumber')
//   })
//   it('snapshot',() =>{
//     cy.clickNav(3, 'Explore')

//     cy.get('[data-test=source-button-selector] > .dropdown > [data-test=wizard-bucket-selected]')
//       .click()
//     // selecting dynamic dropdown item
//     cy.get('[data-test="dropdown--item"]')
//       .each(($el, index, $list) => {
//         if($el.text() == 'InfluxTest2'){
//           $el.click()}
//     })

//     cy.getByTitle('Flux').click()
//     cy.writeManualData('testing_value', 'value=0')

//     cy.get('[data-test=source-button-selector] > .dropdown > [data-test=wizard-bucket-selected]')
//       .click()

//     // selecting dynamic dropdown item
//     cy.clickNav(4, 'Dashboards')
//     cy.getByTitle('Create Dashboard').click()
//     cy.getByTestID('rename-dashboard').click().type('explorer_test{enter}')
//     cy.getByTestID('add-data-btn').click()

//     cy.get('[data-test=source-button-selector] > .dropdown > [data-test=wizard-bucket-selected]')
//     .click()

//     // selecting dynamic dropdown item
//     cy.get('[data-test="dropdown--item"]')
//       .each(($el, index, $list) => {
//         if($el.text() == 'InfluxTest2'){
//           $el.click()}})

//     cy.getByTitle('Flux').click()

//     cy.getByTitle('Script Wizard').click()
//     cy.get('.form--wrapper > :nth-child(1) > .dropdown > [data-test=wizard-bucket-selected]').click()

//     cy.getByTestID('dropdown--item')
//       .filter(':contains("_tasks")')
//       .click()
//     cy.get(':nth-child(2) > .dropdown > [data-test=wizard-bucket-selected]')
//         .click()
//     /*.filter(':contains("testing_value")').click()*/
//     cy.get('[data-test="dropdown--item"]')
//       .each(($el, index, $list) => {
//         if($el.text() == 'testing_value'){
//           $el.click()}})
//     cy.get('.form--submit > .button').click()

//     cy. getByTitle('Visualization').click()
//     cy.get('#SingleStat').click()
//     cy.getByTestID('graph-container')
//       .wait(500)

//     cy.getByTestID('graph-container')
//       .matchImageSnapshot('singleNumber')

//     //  edit graph
//     cy.getByTitle('Save').click()

//     cy.get('.dash-graph--container').wait(1500)
//     cy.get('.dash-graph--container')
//       .matchImageSnapshot('dashboardSingleNumber')
//   })
// })
