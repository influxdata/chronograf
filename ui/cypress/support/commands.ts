import {addMatchImageSnapshotCommand} from 'cypress-image-snapshot/command'

declare namespace Cypress {
  interface Chainable<Subject> {
    /**
     * Custom command to match image snapshots.
     * @example cy.matchImageSnapshot('greeting')
     */
    matchImageSnapshot(snapshotName?: string): void
  }
}

// Set up the settings
addMatchImageSnapshotCommand({
  customSnapshotsDir: '../ui/cypress/snapshots',
  failureThreshold: 0.75, // threshold for entire image
  failureThresholdType: 'percent', // percent of image or number of pixels
  customDiffConfig: {threshold: 0.75}, // threshold for each pixel
  capture: 'viewport', // capture viewport in screenshot
})

Cypress.Commands.overwrite(
  'matchImageSnapshot',
  (originalFn, snapshotName, options) => {
    if (Cypress.env('ALLOW_SCREENSHOT')) {
      originalFn(snapshotName, options)
    } else {
      cy.log(`Screenshot comparison is disabled`)
    }
  }
)

export const getByTestID = (
  dataTest: string,
  options?: Partial<
    Cypress.Loggable & Cypress.Timeoutable & Cypress.Withinable & Cypress.Shadow
  >
): Cypress.Chainable => {
  return cy.get(`[data-test="${dataTest}"]`, options)
}

// Change enviromental values in cypress.json
export const createConnection = (url: string = Cypress.env('url')) => {
  return cy
    .request({
      method: 'POST',
      url: '/chronograf/v1/sources',
      body: {
        url: url,
        username: Cypress.env('username'),
        password: Cypress.env('password'),
        name: Cypress.env('connectionName'),
        insecureSkipVerify: Cypress.env('insecureSkipVerify'),
      },
    })
    .then(() => {
      wrapConnections()
    })
}

export const cutConnections = () => {
  return cy.request('GET', '/chronograf/v1/sources').then(response => {
    response.body.sources.forEach(connection => {
      cy.request('DELETE', `${connection.links.self}`)
    })
  })
}

export const createDashboard = (name: string = 'Default Dashboard') => {
  cy.fixture('routes').then(({dashboards}) => {
    return cy
      .request({
        method: 'POST',
        url: `/chronograf/v1${dashboards}`,
        body: {
          name: name,
        },
      })
      .then(() => {
        wrapDashboards()
      })
  })
}

export const deleteDashboards = () => {
  return cy
    .request('GET', '/chronograf/v1/dashboards')
    .then(({body: responseBody}) => {
      responseBody.dashboards.forEach(dashboard => {
        cy.request('DELETE', `${dashboard.links.self}`)
      })
    })
}

function wrapConnections(): Cypress.Chainable {
  return cy
    .request({
      method: 'GET',
      url: '/chronograf/v1/sources',
    })
    .then(response => {
      const connections = response.body.sources
      cy.wrap(connections).as('connections')
    })
}

function wrapDashboards(): Cypress.Chainable {
  return cy.request('GET', '/chronograf/v1/dashboards').then(response => {
    const dashboards = response.body.dashboards
    cy.wrap(dashboards).as('dashboards')
  })
}

Cypress.Commands.add('getByTestID', getByTestID)
Cypress.Commands.add('createConnection', createConnection)
Cypress.Commands.add('cutConnections', cutConnections)
Cypress.Commands.add('createDashboard', createDashboard)
Cypress.Commands.add('deleteDashboards', deleteDashboards)
