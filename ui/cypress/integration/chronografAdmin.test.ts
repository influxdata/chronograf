describe('Use Admin tab', () => {
    beforeEach(() => {
        cy.OAuthLogin('Test')
        cy.visit('/login')
        cy.removeConnections()
        cy.createConnection()
        cy.get('@connections').then(connections => {
            cy.fixture('routes').then(({adminChronograf}) => {
              cy.visit(`/sources/${connections[0].id}${adminChronograf}/current-organization`)
            })
          })
    })

    it('visit Admin tab and click around', () => {
        cy.get('.chronograf-admin-table--user').should('exist').and('contain.text', 'test@oauth2.mock')
        cy.get('.subsection--tab').contains('All Users').click({force: true})
        cy.get('.chronograf-admin-table--user').should('exist').and('contain.text', 'test@oauth2.mock')
        cy.get('.chronograf-admin-table--user').within(() => {
            cy.get('.slide-toggle').should('have.class', 'active').and('have.class', 'disabled')
        })
    })
})