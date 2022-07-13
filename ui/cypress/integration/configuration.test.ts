describe('Configuration', () => {
  let srcCredentials: any

  before(() => {
    cy.fixture('source').then(sourceCredentials => {
      srcCredentials = sourceCredentials
    })
  })

  beforeEach(() => {
    cy.toInitialState()
    cy.createInfluxDBConnection().then((src: Source) => {
      cy.visit(`/sources/${src.id}/manage-sources`)
    })
  })

  it('use configuration tab to create and delete a source', () => {
    cy.getByTestID('connection-row').should('have.length', 1)
    cy.getByTestID('add-connection--button').click()
    cy.get('.overlay--container').should('exist')
    cy.getByTestID('dismiss-button').click()
    cy.get('.overlay--container').should('not.exist')
    cy.getByTestID('add-connection--button').click()
    cy.getByTestID('connection-url--input')
      .clear()
      .type(srcCredentials.influxDBURL)
    cy.getByTestID('connection-name--input')
      .clear()
      .type(srcCredentials.connectionName)
    cy.getByTestID('connection-username--input')
      .clear()
      .type(srcCredentials.username)
    cy.getByTestID('connection-password--input')
      .clear()
      .type(srcCredentials.password)
    cy.getByTestID('unsafe-ssl--checkbox').click()
    cy.getByTestID('meta-service-connection-url--input')
      .clear()
      .type(srcCredentials.metaUrl)
      .then(() => {})
    cy.get('.wizard-button-bar').within(() => {
      cy.get('button').contains('Add Connection').click()
    })
    cy.getByTestID('go-back--button').click()
    cy.getByTestID('update-connection--button').click()
    cy.getByTestID('next--button').click()
    cy.getByTestID('skip-button').click()
    cy.getByTestID('finish--button').click()
    cy.getByTestID('connection-row')
      .should('have.length', 2)
      .eq(1)
      .realHover()
      .within(() => {
        cy.getByTestID('delete-connection--button').click()
        cy.getByTestID('confirm-btn').click()
      })
    cy.getByTestID('connection-row').should('have.length', 1)
  })
})
