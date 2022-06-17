
const apiUrl = '/chronograf/v1'

export const getByTestID = (
  dataTest: string,
  options?: Partial<
    Cypress.Loggable & Cypress.Timeoutable & Cypress.Withinable & Cypress.Shadow
  >
): Cypress.Chainable => {
  return cy.get(`[data-test="${dataTest}"]`, options)
}

function changeUserInfo(name: string) {
  cy.request({
    method: 'POST',
    url: Cypress.env('oauth2ServerURL') + '/config',
    body: {
      userinfo: {
        name: name,
        email: name + '@oauth2.mock',
      },
    },
  })
}

/**
 * Write a value into a database.
 * @param sourceId - Source ID.
 * @param db - Database name.
 * @param measurement - Measurement name.
 * @param tagValue -  Tags value.
 * @param fieldValue  - Field value.
 */
export const writePoints = (
  sourceId: string,
  db: string,
  measurement: string,
  tagValue: string,
  fieldValue: number
) => {
  cy.request({
    method: 'POST',
    url: `${apiUrl}/sources/${sourceId}/write?db=${db}`,
    headers: {
      'Content-Type': 'text/plain',
    },
    body: `${measurement},tagKey=${tagValue} fieldKey=${fieldValue}`,
  })
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

/**
 * Create a new InfluxDB connection.
 * @param url - InfluxDB URL.
 * @param username - InfluxDB username.
 * @param password - InfluxDB password.
 * @param connectionName  - InfluxDB connection name.
 * @param isUnsafeSSL - If true, allows any certificate presented by the source to be accepted.
 * @param metaUrl - Meta server URL.
 * @returns
 */
export const createInfluxDBConnection = (
  url?: string,
  username?: string,
  password?: string,
  connectionName?: string,
  isUnsafeSSL?: boolean,
  metaUrl?: string
) => {
  return cy
    .request({
      method: 'POST',
      url: `${apiUrl}/sources`,
      body: {
        url: url ?? Cypress.env('influxDBURL'),
        username: username ?? Cypress.env('username'),
        password: password ?? Cypress.env('password'),
        name: connectionName ?? Cypress.env('connectionName'),
        insecureSkipVerify: isUnsafeSSL ?? Cypress.env('insecureSkipVerify'),
        metaUrl: metaUrl ?? Cypress.env('metaUrl'),
      },
    })
    .then(() => {
      wrapConnections()
    })
}

/**
 * Remove all InfluxDB connections.
 */
export const removeInfluxDBConnections = () => {
  return cy
    .request('GET', `${apiUrl}/sources`)
    .then(response => {
      response.body.sources.forEach((source: any) => {
        cy.request('DELETE', `${source.links.self}`)
      })
    })
    .then(() => {
      wrapConnections()
    })
}

/**
 * Create a new dashboard.
 * @param name - The name of the dashboard.
 */
export const createDashboard = (name?: string) => {
  return cy
    .request({
      method: 'POST',
      url: `${apiUrl}/dashboards`,
      body: {
        name: name ?? 'Default Dashboard',
      },
    })
    .then(() => {
      wrapDashboards()
    })
}

/**
 * Delete all dashboards.
 */
export const deleteDashboards = () => {
  return cy
    .request('GET', `${apiUrl}/dashboards`)
    .then(({body: responseBody}) => {
      responseBody.dashboards.forEach((dashboard: any) => {
        cy.request('DELETE', dashboard.links.self)
      })
    })
    .then(() => {
      wrapDashboards()
    })
}

/**
 * Create a new dashboard with a cell.
 * @param query - InfluxDB query.
 * @param dashboardName - The name of the dashboard.
 * @param cellName  - The name of the cell.
 * @param xPosition - Cell's X position.
 * @param yPosition  Cell's Y position.
 * @param cellWidth  Cell's width.
 * @param cellHeight  Cell's height.
 */
export const createDashboardWithCell = (
  query?: string,
  dashboardName?: string,
  cellName?: string,
  xPosition?: number,
  yPosition?: number,
  cellWidth?: number,
  cellHeight?: number
) => {
  return cy
    .request({
      method: 'POST',
      url: `${apiUrl}/dashboards/`,
      body: {
        cells: [
          {
            x: xPosition ?? 0,
            y: yPosition ?? 0,
            w: cellWidth ?? 8,
            h: cellHeight ?? 4,
            name: cellName ?? 'Unnamed Cell',
            queries: [
              {
                query: query,
                db: Cypress.env('connectionName'),
                label: '%',
              },
            ],
          },
        ],
        name: dashboardName ?? 'Unnamed Dashboard',
      },
    })
    .then(() => {
      wrapDashboards()
    })
}

/**
 * Create a Chronograf user.
 * @param userName - Chronograf username.
 * @param provider - OAuth provider used to authenticate.
 * @param scheme - Scheme used to authenticate.
 * @param organization - Organization name. Default value is set to 'default'.
 * @param role - Name of the default role. Default value is set to 'reader'.
 * @returns
 */
export const createChronografUser = (
  userName: string,
  provider: string,
  scheme: string,
  organization?: string,
  role?: string
) => {
  return cy
    .request({
      method: 'POST',
      url: `${apiUrl}/users`,
      body: {
        name: userName + '@oauth2.mock',
        provider: provider,
        roles: [
          {
            name: role ?? 'reader',
            organization: organization ?? 'default',
          },
        ],
        scheme: scheme,
      },
    })
    .then(() => {
      wrapChronografUsers()
    })
}

/**
 * Delete all Chronograf users within the current organization with the given name.
 * @param name - The name of the user.
 */
export const deleteChronografUser = (name: string) => {
  const userName = name + '@oauth2.mock'
  return cy
    .request('GET', `${apiUrl}/users`)
    .then(({body: responseBody}) => {
      responseBody.users.forEach((user: any) => {
        if (userName == user.name) {
          cy.request('DELETE', user.links.self)
        }
      })
    })
    .then(() => {
      wrapChronografUsers()
    })
}

/**
 * Delete all Chronograf users within the current organization except for the first administrator.
 */
export const deleteChronografUsers = () => {
  return cy
    .request({
      method: 'GET',
      url: `${apiUrl}/users`,
    })
    .then(({body: responseBody}) => {
      responseBody.users.slice(1).forEach((user: any) => {
        cy.request('DELETE', user.links.self)
      })
    })
    .then(() => {
      wrapChronografUsers()
    })
}

/**
 * Create a new organization.
 * @param orgName - Organization name.
 * @param defaultRole  - Default organization role.
 */
export const createOrg = (orgName: string, defaultRole: string) => {
  return cy
    .request({
      method: 'POST',
      url: `${apiUrl}/organizations`,
      body: {
        defaultRole: defaultRole,
        name: orgName,
      },
    })
    .then(() => {
      wrapOrgs()
    })
}

/**
 * Delete an organization.
 * @param id - Organization ID.
 */
export const deleteOrg = (id: string) => {
  return cy.request('DELETE', `${apiUrl}/organizations/${id}`).then(() => {
    wrapOrgs()
  })
}

/**
 *  Delete all organizations.
 */
export const deleteOrgs = () => {
  return cy
    .request('GET', `${apiUrl}/organizations`)
    .then(({body: responseBody}) => {
      responseBody.organizations.slice(1).forEach((organization: any) => {
        cy.request('DELETE', organization.links.self)
      })
    })
    .then(() => {
      wrapOrgs()
    })
}
/**
 * Create an InfluxDB user.
 * @param name - Username.
 * @param passwd - Password.
 * @param sourceId - Source ID.
 */
export const createInfluxDBUser = (
  name: string,
  passwd: string,
  sourceId: string
) => {
  return cy
    .request({
      method: 'POST',
      url: `${apiUrl}/sources/${sourceId}/users`,
      body: {
        name: name,
        password: passwd,
      },
    })
    .then(() => {
      wrapInfluxDBUsers(sourceId)
    })
}

/**
 * Delete an InfluxDB user.
 * @param name - Username.
 * @param sourceId - Source ID.
 */
export const deleteInfluxDBUser = (name: string, sourceId: string) => {
  return cy
    .request({
      method: 'DELETE',
      url: `${apiUrl}/sources/${sourceId}/users/${name}`,
    })
    .then(() => {
      wrapInfluxDBUsers(sourceId)
    })
}

/**
 * Delete all users from the InfluxDB source.
 * @param sourceId - Source ID.
 */
export const deleteInfluxDBUsers = (sourceId: string) => {
  return cy
    .request('GET', `${apiUrl}/sources/${sourceId}/users`)
    .then(({body: responseBody}) => {
      responseBody.users.forEach((user: any) => {
        if (user.name != Cypress.env('username')) {
          cy.request('DELETE', user.links.self)
        }
      })
    })
}

/**
 * Create a default InfluxDB role.
 * @param name - Name of the role.
 * @param sourceId - Source ID.
 */
export const createInfluxDBRole = (name: string, sourceId: string) => {
  return cy
    .request({
      method: 'POST',
      url: `${apiUrl}/sources/${sourceId}/roles`,
      body: {
        name: name,
      },
    })
    .then(() => {
      wrapInfluxDBRoles(sourceId)
    })
}

/**
 * Delete a role.
 * @param name - Name of the role.
 * @param sourceId - Source ID.
 * @returns
 */
export const deleteInfluxDBRole = (name: string, sourceId: string) => {
  return cy
    .request({
      method: 'DELETE',
      url: `${apiUrl}/sources/${sourceId}/roles/${name}`,
    })
    .then(() => {
      wrapInfluxDBRoles(sourceId)
    })
}

/**
 * Delete all roles from the given source.
 * @param sourceId - Source ID.
 */
export const deleteInfluxDBRoles = (sourceId: string) => {
  return cy
    .request('GET', `${apiUrl}/sources/${sourceId}/roles`)
    .then(({body: responseBody}) => {
      responseBody.roles.forEach((role: any) => {
        cy.request('DELETE', role.links.self)
      })
    })
}

/**
 * Create a new InfluxDB.
 * @param name - Name of the database.
 * @param sourceId - Source ID.
 */
export const createInfluxDB = (name: string, sourceId: string) => {
  return cy.request({
    method: 'POST',
    url: `${apiUrl}/sources/${sourceId}/dbs`,
    body: {
      name: name,
    },
  })
}

/**
 * Delete a specific InfluxDB from the given source.
 * @param name - Name of the database.
 * @param sourceId  - Source ID.
 */
export const deleteInfluxDB = (name: string, sourceId: string) => {
  return cy.request('DELETE', `${apiUrl}/sources/${sourceId}/dbs/${name}`)
}

/**
 * Delete all InfluxDBs from the given source.
 * @param sourceId
 */
export const deleteInfluxDBs = (sourceId: string) => {
  return cy
    .request('GET', `${apiUrl}/sources/${sourceId}/dbs`)
    .then(({body: responseBody}) => {
      responseBody.databases.forEach((db: any) => {
        cy.request('DELETE', db.links.self)
      })
    })
}

function wrapConnections() {
  return cy
    .request({
      method: 'GET',
      url: `${apiUrl}/sources`,
    })
    .then(({body: response}) => {
      const connections = response.sources
      cy.wrap(connections).as('connections')
    })
}

function wrapDashboards() {
  return cy.request('GET', `${apiUrl}/dashboards`).then(({body: response}) => {
    cy.wrap(response.dashboards).as('dashboards')
  })
}

function wrapOrgs() {
  return cy
    .request('GET', `${apiUrl}/organizations`)
    .then(({body: response}) => {
      cy.wrap(response.organizations).as('orgs')
    })
}

function wrapInfluxDBUsers(sourceId: string) {
  return cy
    .request('GET', `${apiUrl}/sources/${sourceId}/users`)
    .then(({body: response}) => {
      cy.wrap(response.users).as('influxDBUsers')
    })
}

function wrapInfluxDBRoles(sourceId: string) {
  return cy
    .request('GET', `${apiUrl}/sources/${sourceId}/roles`)
    .then(({body: response}) => {
      cy.wrap(response.roles).as('influxDBRoles')
    })
}

function wrapChronografUsers() {
  return cy.request('GET', `${apiUrl}/users`).then(({body: response}) => {
    cy.wrap(response.users).as('chronografUsers')
  })
}

/**
 * Set application to a default state.
 */
export function toInitialState() {
  cy.OAuthLogin('test')
  cy.visit('/')
  cy.request({
    method: 'GET',
    url: `${apiUrl}/sources`,
  }).then(({body: responseBody}) => {
    responseBody.sources.forEach((source: any) => {
      cy.deleteInfluxDBs(source.id)
      cy.deleteInfluxDBRoles(source.id)
      cy.deleteInfluxDBUsers(source.id)
    })
  })

  cy.deleteDashboards()
  cy.deleteChronografUsers()
  cy.deleteOrgs()
  cy.removeInfluxDBConnections()
}

export const clickAttached = (subject?: JQuery<HTMLElement>): void => {
  if(!subject) {
    console.error('no element provided to "clickAttached"')
    return
  }

  cy.wrap(subject).should($el => {
    expect(Cypress.dom.isDetached($el)).to.be.false
    $el.trigger('click')
  })
}

Cypress.Commands.add('getByTestID', getByTestID)
Cypress.Commands.add('createInfluxDBConnection', createInfluxDBConnection)
Cypress.Commands.add('removeInfluxDBConnections', removeInfluxDBConnections)
Cypress.Commands.add('createDashboard', createDashboard)
Cypress.Commands.add('deleteDashboards', deleteDashboards)
Cypress.Commands.add('createDashboardWithCell', createDashboardWithCell)
Cypress.Commands.add('OAuthLogin', OAuthLogin)
Cypress.Commands.add('OAuthLogout', OAuthLogout)
Cypress.Commands.add('OAuthLoginAsDiffUser', OAuthLoginAsDiffUser)
Cypress.Commands.add('createChronografUser', createChronografUser)
Cypress.Commands.add('deleteChronografUser', deleteChronografUser)
Cypress.Commands.add('deleteChronografUsers', deleteChronografUsers)
Cypress.Commands.add('createOrg', createOrg)
Cypress.Commands.add('deleteOrg', deleteOrg)
Cypress.Commands.add('deleteOrgs', deleteOrgs)
Cypress.Commands.add('createInfluxDBUser', createInfluxDBUser)
Cypress.Commands.add('deleteInfluxDBUser', deleteInfluxDBUser)
Cypress.Commands.add('deleteInfluxDBUsers', deleteInfluxDBUsers)
Cypress.Commands.add('createInfluxDBRole', createInfluxDBRole)
Cypress.Commands.add('deleteInfluxDBRole', deleteInfluxDBRole)
Cypress.Commands.add('deleteInfluxDBRoles', deleteInfluxDBRoles)
Cypress.Commands.add('createInfluxDB', createInfluxDB)
Cypress.Commands.add('deleteInfluxDB', deleteInfluxDB)
Cypress.Commands.add('deleteInfluxDBs', deleteInfluxDBs)
Cypress.Commands.add('toInitialState', toInitialState)
Cypress.Commands.add('writePoints', writePoints)
Cypress.Commands.add('clickAttached', clickAttached)
