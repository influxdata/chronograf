export const clickNav = (index: number, label: string): Cypress.Chainable => {
    cy.get(`:nth-child(${index}) > .sidebar--square`).click()
    return cy.get('h1.page-header--title').should('have.text', `${label}`)
}
Cypress.Commands.add('clickNav', clickNav)
