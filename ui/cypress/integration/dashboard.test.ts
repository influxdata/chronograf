describe('Use Dashboards', () => {
  beforeEach(() => {
    cy.OAuthLogin('test')
    cy.removeConnections()
    cy.createConnection()
    cy.get('@connections').then(connections => {
      cy.fixture('routes').then(({dashboards}) => {
        cy.visit(`/sources/${connections[0].id}${dashboards}`)
      })
    })
    cy.deleteDashboards()
    cy.createDashboard('Reader Dashboard')
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
        cy.get('.confirm-button--confirmation').eq(1).click({force: true})
      })
  })

  describe('Use Dashboards as reader', () => {
    beforeEach(() => {
      cy.deleteUser('Reader')
      cy.createUser('Reader', 'oauth-mock', 'oauth2')
      cy.OAuthLoginAsDiffUser('Reader')
      cy.OAuthLogout()
    })

    it('ensure that all elements used to edit Chronograf are not visible', () => {
        cy.getByTestID('sidebar').should('not.exist')
        cy.getByTestID('import-dashboard--button').should('not.exist')
        cy.getByTestID('create-dashboard-button').should('not.exist')
        cy.getByTestID('dashboard-filter--input').type('Empty')
        cy.getByTestID('dashboard-panel').should('have.text', `Looks like you don’t have any dashboards`)
        cy.getByTestID('dashboard-filter--input').clear().type('Dashboard')
        cy.getByTestID('Reader Dashboard').click()
        cy.get('.dashboard-empty--menu').should('not.exist')
        cy.getByTestID('add-cell').should('not.exist')
        cy.getByTestID('show-variables--button').click()
        cy.getByTestID('add-template-variable').should('not.exist')
        cy.getByTestID('show-annotations--button').click()
        cy.getByTestID('add-annotation--button').should('not.exist')
        cy.getByTestID('add-annotation-filter--button').should('not.exist')
    })
  })
})
