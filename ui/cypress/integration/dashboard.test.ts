import {Source} from '../support/types'

describe('Use Dashboards', () => {
  let source: Source

  beforeEach(() => {
    cy.toInitialState()
    cy.createInfluxDBConnection().then((src: Source) => {
      source = src
      cy.visit(`/sources/${source.id}/dashboards`)
    })
  })

  it('create, rename and delete a dashboard', () => {
    const newName = 'DashboardQA'

    cy.get('button').contains('Create Dashboard').click()
    cy.get('.rename-dashboard')
      .should('have.text', 'Name This Dashboard')
      .type(`${newName}{enter}`)
      .should('have.text', newName)

    cy.visit(`/sources/${source.id}/dashboards`)
    // DOM Element where the dashboard resides
    cy.get('.panel-body > table > tbody')
      .should('exist')
      .within(() => {
        // delete button
        cy.get('.confirm-button--confirmation').click({force: true})
      })
  })

  describe('Use Dashboards as reader', () => {
    beforeEach(() => {
      cy.createDashboard('Reader Dashboard').then(() => {
        cy.createChronografUser('Reader', 'oauth-mock', 'oauth2').then(() => {
          cy.getByTestID('dashboard-panel')
            .should('be.visible')
            .then(() => {
              cy.OAuthLoginAsDiffUser('Reader')
            })
        })
      })
    })

    it.only('ensure that all elements used to edit Chronograf are not visible', () => {
      cy.getByTestID('sidebar').should('not.exist')
      cy.getByTestID('import-dashboard--button').should('not.exist')
      cy.getByTestID('create-dashboard-button').should('not.exist')
      cy.getByTestID('dashboard-filter--input').type('Empty')
      cy.getByTestID('dashboard-panel').should(
        'contain.text',
        `Looks like you don’t have any dashboards`
      )

      cy.getByTestID('dashboard-filter--input').clear().type('Dashboard')
      cy.get('@dashboards').then(dashboards => {
        cy.getByTestID(`dashboard-link-${dashboards[0].id}`).click()
      })

      cy.get('.dashboard-empty--menu').should('not.exist')
      cy.getByTestID('add-cell').should('not.exist')
      cy.get('.template-control-bar').should('not.exist')
      cy.getByTestID('show-variables--button').should('be.visible').click()
      cy.get('.template-control-bar').should('exist').and('be.visible')
      cy.get('.annotation-control-bar').should('not.exist')
      cy.getByTestID('show-annotations--button').should('be.visible').click()
      cy.get('.annotation-control-bar').should('exist').and('be.visible')
      cy.getByTestID('add-template-variable').should('not.exist')
      cy.getByTestID('add-annotation--button').should('not.exist')
      cy.window()
        .its('localStorage')
        .then(({state}) => {
          cy.wrap(state).should(
            'contain',
            '"showTemplateVariableControlBar":true'
          )
          cy.wrap(state).should('contain', '"showAnnotationControls":true')
        })
        
      cy.reload().then(() => {
        cy.get('.page-header--title')
          .should('exist')
          .and('be.visible')
          .then(() => {
            cy.get('.template-control-bar').should('exist').and('be.visible')
            cy.get('.annotation-control-bar').should('exist').and('be.visible')
          })
      })
    })
  })
})
