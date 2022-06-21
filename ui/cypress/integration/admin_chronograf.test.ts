/*
    In these tests you will find realHover and clickAttached functions.
    They are used to assure that Cypress can see re-rendered elements and click on them.
    realHover is used whenever there is a need to fire a hover event, which will make certain elements visible.
    clickAttached is used to assure that the element is attached to the DOM and then uses JQuery trigger to click on the element.
*/

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
        cy.get('.dropdown-selected').click()
        cy.getByTestID(`${chronograf.user.role[1]}-dropdown-item`).realHover()
        cy.getByTestID(`${chronograf.user.role[1]}-dropdown-item`).click()
      })

      cy.getByTestID(`${chronograf.user.name}--table-row`).should('be.visible')

      cy.getByTestID(`${chronograf.user.name}--table-row`).realHover()
      cy.getByTestID(`${chronograf.user.name}--table-row`).within(() => {
        cy.getByTestID('remove-user--button').should('be.visible')
        cy.getByTestID('remove-user--button').click()
        cy.getByTestID('confirm-btn').should('be.visible')
        cy.getByTestID('confirm-btn').click()
      })
    })
  })

  describe('All Users', () => {
    beforeEach(() => {
      cy.visit(url + '/all-users')
    })

    it('add user, edit user, and remove it', () => {
      cy.getByTestID('new-user-admins--toggle')
        .click()
        .should('have.class', 'active')
      cy.getByTestID('add-user--button').click()
      cy.getByTestID('new-user--table-row')
        .should('exist')
        .within(() => {
          cy.getByTestID('cancel-new-user--button').click()
        })
      cy.getByTestID('add-user--button').click()
      cy.getByTestID('new-user--table-row')
        .should('exist')
        .within(() => {
          cy.getByTestID('username--input').type(chronograf.user.name)
          cy.getByTestID('dropdown-toggle').click()
          cy.getByTestID('dropdown-ul')
            .contains(chronograf.user.orgs[0])
            .click()
          cy.getByTestID(
            `dropdown-selected--${chronograf.user.orgs[0]}`
          ).should('exist')
          cy.getByTestID('oauth-provider--input').type(
            chronograf.user.oauthProvider
          )
          cy.getByTestID('confirm-new-user--button').click()
        })

      cy.getByTestID('new-user-admins--toggle')
        .click()
        .should('not.have.class', 'active')

      cy.getByTestID(`${chronograf.user.name}--table-row`)
        .should('exist')
        .realHover()
        .then(() => {
          cy.getByTestID(`${chronograf.user.name}--table-row`).within(() => {
            cy.getByTestID('superAdmin--toggle').click()
          })
        })

      cy.getByTestID(`${chronograf.user.name}--table-row`).realHover()

      cy.getByTestID(`${chronograf.user.name}--table-row`).within(() => {
        cy.get(`.input-tag--item`)
          .contains(chronograf.user.orgs[0])
          .should('exist')
        cy.getByTestID('delete-tag--button').clickAttached()
        cy.getByTestID('delete-tag--button').within(() => {
          cy.getByTestID('confirm-btn').click()
        })

        cy.get(`.input-tag--item`)
          .should('not.exist')
      })

      cy.getByTestID(`${chronograf.user.name}--table-row`).realHover()
      cy.getByTestID(`${chronograf.user.name}--table-row`).within(() => {
        cy.get('.tags-add')
          .click()
          .within(() => {
            cy.get('.tags-add--menu-item')
              .contains(chronograf.user.orgs[0])
              .clickAttached()
          })
      })

      cy.getByTestID(`${chronograf.user.name}--table-row`).realHover()
      cy.getByTestID(`${chronograf.user.name}--table-row`).within(() => {
        cy.getByTestID('delete-user--button').clickAttached()
        cy.getByTestID('delete-user--button').within(() => {
          cy.getByTestID('confirm-btn').clickAttached()
        })
      })
    })
  })
})
