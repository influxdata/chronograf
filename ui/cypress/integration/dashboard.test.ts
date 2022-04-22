describe('dashboards', () => {
  beforeEach(() => {
    cy.OAuthLogin('test')
    cy.deleteDashboards()
    cy.removeConnections()
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