describe('Chronograf', () => {
  let chronograf: any
  let url: string
  let sourceId: string

  before(() => {
    cy.fixture('chronograf').then(chronografData => {
      chronograf = chronografData
    })
  })

  beforeEach(() => {
    cy.toInitialState()
    cy.createInfluxDBConnection()
    cy.get('@connections').then(sources => {
      sourceId = sources[0].id
      url = `/sources/${sourceId}/admin-chronograf`
    })
  })

  describe('Current Org', () => {
    beforeEach(() => {
      cy.visit(url + '/current-organization')
    })

    it('create, edit, and delete a Chronograf user', () => {
      cy.getByTestID('add-user--button').click()
      cy.getByTestID('cancel-new-user--button').click()
      cy.getByTestID('add-user--button').click()
      cy.getByTestID('new-user--table-row').within(() => {
        cy.getByTestID('confirm-new-user--button').should('be.disabled')
        cy.getByTestID('username--input')
          .type(chronograf.user.name)
          .should('have.value', chronograf.user.name)
        cy.getByTestID('confirm-new-user--button').should('be.disabled')
        cy.getByTestID('dropdown-toggle').click()
        cy.getByTestID(`${chronograf.user.role[0]}-dropdown-item`).click()
        cy.get('.dropdown-selected').should(
          'contain.text',
          chronograf.user.role[0]
        )

        cy.getByTestID('oauth-provider--input')
          .type(chronograf.user.oauthProvider)
          .should('have.value', chronograf.user.oauthProvider)
        cy.get('.dropdown-selected').should(
          'contain.text',
          chronograf.user.role[0]
        )

        cy.getByTestID('confirm-new-user--button').should('be.enabled').click()
      })

      cy.getByTestID(`${chronograf.user.name}--table-row`).should('be.visible')

      cy.getByTestID(`${chronograf.user.name}--table-row`).realHover()
      cy.getByTestID(`${chronograf.user.name}--table-row`).within(() => {
        cy.get('.dropdown-selected').should('be.visible')
        cy.get('.dropdown-selected').realHover()
        cy.get('.dropdown-selected').clickAttached()
        cy.getByTestID(`${chronograf.user.role[1]}-dropdown-item`).realHover()
        cy.getByTestID(
          `${chronograf.user.role[1]}-dropdown-item`
        ).clickAttached()
      })

      cy.getByTestID(`${chronograf.user.name}--table-row`).should('be.visible')

      cy.getByTestID(`${chronograf.user.name}--table-row`).realHover()
      cy.getByTestID(`${chronograf.user.name}--table-row`).within(() => {
        cy.getByTestID('remove-user--button').should('be.visible')
        cy.getByTestID('remove-user--button').clickAttached()
        cy.getByTestID('confirm-btn').should('be.visible')
        cy.getByTestID('confirm-btn').clickAttached()
      })
    })
  })
})
