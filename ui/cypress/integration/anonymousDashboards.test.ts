describe('use Chronograf as user assigned reader role', () => {
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
        cy.getByTestID('dashboard-filter--input').type('Empty')
        cy.getByTestID('dashboard-panel').should('have.text', `Looks like you don’t have any dashboards`)
        cy.getByTestID('dashboard-filter--input').clear().type('Dashboard')
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