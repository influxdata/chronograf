describe('Log in and Log out using OAuth2 Mock Server', () => {
    it('use OAuth2 Mock Server', () => {
        cy.OAuthLogout()
        cy.visit('/login')
        cy.wait(2000)
        cy.OAuthLogin('test')
        cy.wait(2000)
        cy.OAuthLogout()
        cy.wait(2000)
        cy.OAuthLogin('Reader')
        cy.wait(2000)
    })
})