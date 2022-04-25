describe('Use Dashboards', () => {
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

  describe('Use Dashboards as reader', () => {
    let query = `SELECT mean("pointsWritten") AS "mean_pointsWritten" 
                     FROM "_internal"."monitor"."localStore" 
                     WHERE time > :dashboardTime: AND time < :upperDashboardTime: 
                     GROUP BY time(:interval:) FILL(null)`

    beforeEach(() => {
        cy.OAuthLogin('test')
        cy.deleteUser('Reader')
        cy.deleteDashboards()
        cy.removeConnections()
        cy.createConnection()
        cy.createDashboardWithCell(query)
        cy.createUser('Reader', 'oauth-mock', 'oauth2')
        cy.OAuthLogout()
        cy.OAuthLogin('Reader')
        cy.visit('/')
    })

    it('use dashboards as user with reader role', () => {
        cy.getByTestID('sidebar').should('not.exist')
        cy.getByTestID('import-dashboard--button').should('not.exist')
        cy.getByTestID('create-dashboard-button').should('not.exist')
        cy.get('.form-control').type('Empty')
        cy.getByTestID('dashboard-panel').should('have.text', `Looks like you don’t have any dashboards`)
         cy.get('.form-control').clear().type('Dashboard')
        cy.getByTestID('Unnamed Dashboard').click()
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
