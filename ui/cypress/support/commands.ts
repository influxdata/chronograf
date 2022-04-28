import { addMatchImageSnapshotCommand } from 'cypress-image-snapshot/command'

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
  customDiffConfig: { threshold: 0.75 }, // threshold for each pixel
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
): globalThis.Cypress.Chainable<JQuery<HTMLElement>> => {
  return cy.get(`[data-test="${dataTest}"]`, options)
}

// Function sends HTTP POST request to OAuth2 Mock server in order to change user information
const changeUserInfo: Function = (name: string): void => {
  const xhttp: XMLHttpRequest = new XMLHttpRequest()
  const url: string = Cypress.env('oauth2ServerURL') + '/config'
  const body = {
    "userinfo": {
      "name": name,
      "email": name + "@oauth2.mock"
    }
  }

  xhttp.open('POST', url)
  xhttp.setRequestHeader('Content-Type', 'application/json')
  xhttp.send(JSON.stringify(body))
}

export const OAuthLogin = (name: string) => {
    changeUserInfo(name)
    return cy.visit('/oauth/oauth-mock/login')
}

export const OAuthLogout = () => {
  return cy.visit('/oauth/oauth-mock/logout')
}

export const OAuthLoginAsDiffUser = (name: string) => {
  changeUserInfo(name)
  return cy.visit('/oauth/oauth-mock/logout')
}
// Change enviromental values in cypress.json
export const createConnection = (url?: string) => {
  return cy
    .request({
      method: 'POST',
      url: '/chronograf/v1/sources',
      body: {
        url: url ?? Cypress.env('influxDBURL'),
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

export const removeConnections = () => {
  return cy.request('GET', '/chronograf/v1/sources').then(response => {
    response.body.sources.forEach(connection => {
      cy.request('DELETE', `${connection.links.self}`)
    })
  })
}

export const createDashboard = (name?: string) => {
  return cy
    .fixture('routes').then(({ dashboards }) => {
    return cy
      .request({
        method: 'POST',
        url: `/chronograf/v1${dashboards}`,
        body: {
          name: name ?? 'Default Dashboard',
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
    .then(({ body: response }) => {
      response.dashboards.forEach(dashboard => {
        cy.request('DELETE', `${dashboard.links.self}`)
      })
    })
    .then(() => {
      wrapDashboards()
    })
}

export const createDashboardWithCell = (
  query?: string,
  dashboardName?: string,
  cellName?: string, 
  xPosition?: number, 
  yPosition?: number, 
  cellWidth?: number, 
  cellHeight?: number, 
) => {
  return cy
    .request({
      method: 'POST',
      url: `/chronograf/v1/dashboards/`,
      body: {
        "cells": [
          {
            "x": xPosition ?? 0,
            "y": yPosition ?? 0,
            "w": cellWidth ?? 8,
            "h": cellHeight ?? 4,
            "name": cellName ?? "Unnamed Cell",
            "queries": [
              {
                "query": query,
                "db": Cypress.env('connectionName'),
                "label": "%",
              }
            ]
          }
        ],
        name: dashboardName ?? "Unnamed Dashboard"
      }
    })
}

export const createUser = (
  userName: string, 
  provider: string, 
  scheme: string, 
  organization?: string, 
  role?: string
) => {
  return cy.request({
    method: 'POST',
    url: '/chronograf/v1/users',
    body: {
      "name": userName + "@oauth2.mock",
      "provider": provider,
      "roles": [{
        "name": role ?? "reader",
        "organization": organization ?? "default"
      }],
      "scheme": scheme,
    }
  })
}

export const deleteUser = (name: string) => {
  const userName = name + '@oauth2.mock'
  return cy
    .request('GET', '/chronograf/v1/users')
    .then(({ body: response }) => {
      response.users.forEach(user => {
        if (userName == user.name) {
          cy.request('DELETE', user.links.self)
        }
      })
    })
}

export const createOrg = (orgName: string, defaultRole: string) => {
  return cy.request({
    method: 'POST',
    url: '/chronograf/v1/organizations',
    body: {
      "defaultRole": defaultRole,
      "name": orgName
    }
  })
    .then(() => {
      wrapOrgs()
    })
}

export const deleteOrg = (id: string) => {
  return cy.request('DELETE', `/chronograf/v1/organizations/${id}`)
}

function wrapConnections() {
  return cy
    .request({
      method: 'GET',
      url: '/chronograf/v1/sources',
    })
    .then(({ body: response }) => {
      const connections = response.sources
      cy.wrap(connections).as('connections')
    })
}

function wrapDashboards() {
  return cy.request('GET', '/chronograf/v1/dashboards').then(({ body: response }) => {
    cy.wrap(response.dashboards).as('dashboards')
  })
}

function wrapOrgs() {
  return cy.request('GET', '/chronograf/v1/organizations').then(({ body: response }) => {
    cy.wrap(response.organizations).as('orgs')
  })
}

Cypress.Commands.add('getByTestID', getByTestID)
Cypress.Commands.add('createConnection', createConnection)
Cypress.Commands.add('removeConnections', removeConnections)
Cypress.Commands.add('createDashboard', createDashboard)
Cypress.Commands.add('deleteDashboards', deleteDashboards)
Cypress.Commands.add('createDashboardWithCell', createDashboardWithCell)
Cypress.Commands.add('OAuthLogin', OAuthLogin)
Cypress.Commands.add('OAuthLogout', OAuthLogout)
Cypress.Commands.add('OAuthLoginAsDiffUser', OAuthLoginAsDiffUser)
Cypress.Commands.add('createUser', createUser)
Cypress.Commands.add('deleteUser', deleteUser)
Cypress.Commands.add('createOrg', createOrg)
Cypress.Commands.add('deleteOrg', deleteOrg)