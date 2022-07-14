describe('Configuration', () => {
  let srcConfig: any

  before(() => {
    cy.fixture('source').then(sourceCredentials => {
      srcConfig = sourceCredentials
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
    cy.getByTestID('connection-url--input').clear().type(srcConfig.influxDBURL)
    cy.getByTestID('connection-name--input')
      .clear()
      .type(srcConfig.connectionName)
    cy.getByTestID('connection-username--input')
      .clear()
      .type(srcConfig.username)
    cy.getByTestID('connection-password--input')
      .clear()
      .type(srcConfig.password)
    cy.getByTestID('unsafe-ssl--checkbox').click()
    cy.getByTestID('meta-service-connection-url--input')
      .clear()
      .type(srcConfig.metaUrl)
      .then(() => {})
    cy.get('.wizard-button-bar').within(() => {
      cy.get('button').contains('Add Connection').click()
    })
    cy.get('button').contains('Go Back').click()
    cy.get('button').contains('Update Connection').click()
    cy.get('button').contains('Next').click()

    cy.getByTestID('skip-button').click()
    cy.get('button').contains('Finish').click()

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
