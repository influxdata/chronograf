import {Source} from '../support/types'

/*
    In these tests you will find realHover and clickAttached functions.
    They are used to assure that Cypress can see re-rendered elements and click on them.
    realHover is used whenever there is a need to fire a hover event, which will make certain elements visible.
    clickAttached is used to assure that the element is attached to the DOM and then uses JQuery trigger to click on the element.
*/

describe('Chronograf', () => {
  let chronograf: any
  let url: string
  let source: Source

  before(() => {
    cy.fixture('chronograf').then(chronografData => {
      chronograf = chronografData
    })
  })

  beforeEach(() => {
    cy.toInitialState()
    cy.createInfluxDBConnection().then((src: Source) => {
      source = src
      url = `/sources/${source.id}/admin-chronograf`
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

      cy.visit(url + '/current-organization')
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

  describe('All Orgs', () => {
    beforeEach(() => {
      cy.visit(url + '/all-organizations')
    })

    it.only('create an org, edit it, and delete it', () => {
      cy.getByTestID('create-new-org--button').click()
      cy.getByTestID('cancel').click()
      cy.getByTestID(
        `${chronograf.organizations[0].name}-org--row`
      ).should('not.exist')

      cy.getByTestID('create-new-org--button').click()
      cy.getByTestID('new-org--row').within(() => {
        cy.getByTestID('new-org-name--input')
          .clear()
          .type(chronograf.organizations[0].name)

        cy.get('.dropdown-selected').click()
        cy.getByTestID(
          `${chronograf.organizations[0].defaultRole}-dropdown-item`
        ).click()
        cy.get('.dropdown-selected').should('contain.text', chronograf.organizations[0].defaultRole)

        cy.getByTestID('confirm').click()
      })

      cy.getByTestID(`${chronograf.organizations[0].name}-org--row`)
        .should('exist')
        .within(() => {
          cy.getByTestID(`${chronograf.organizations[0].name}-org-name`)
            .should('exist')
            .and('contain.text', chronograf.organizations[0].name)
            .then($el => {
              if (Cypress.dom.isDetached($el)) cy.wait(500);
              Cypress.$($el).trigger('click')
            });

          cy.getByTestID('rename-org--input')
            .should('exist')
            .clear()
            .type(chronograf.organizations[1].name + '{enter}')
          cy.getByTestID(
            `${chronograf.organizations[1].name}-org-name`
          ).should('contain.text', chronograf.organizations[1].name)

          cy.get('.dropdown-selected').click()
          cy.getByTestID(`${chronograf.organizations[1].defaultRole}-dropdown-item`
          ).click()
          cy.get('.dropdown-selected').should('contain.text', chronograf.organizations[1].defaultRole)
          cy.getByTestID('delete-org--button').click()
            
          cy.getByTestID(`${chronograf.organizations[1].name}-org--row`)
          .should('not.exist')
        })
    })
  })
})
