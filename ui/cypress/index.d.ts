import 'jest'

import {
  getByTestID,
  removeConnections,
  createConnection,
  createDashboard,
  deleteDashboards,
  createDashboardWithCell,
  OAuthLogin,
  OAuthLogout,
  OAuthLoginAsDiffUser,
  createUser,
  deleteUser,
  createOrg,
  deleteOrg,
  createInfluxDBUser,
  deleteInfluxDBUser,
  createInfluxDBRole,
  deleteInfluxDBRole,
  createInfluxDB,
  deleteInfluxDB
} from './support/commands'

declare global {
  namespace Cypress {
    interface Chainable {
      getByTestID: typeof getByTestID
      removeConnections: typeof removeConnections
      createConnection: typeof createConnection
      createDashboard: typeof createDashboard
      deleteDashboards: typeof deleteDashboards
      createDashboardWithCell: typeof createDashboardWithCell
      OAuthLogin: typeof OAuthLogin
      OAuthLogout: typeof OAuthLogout
      OAuthLoginAsDiffUser: typeof OAuthLoginAsDiffUser
      createUser: typeof createUser
      deleteUser: typeof deleteUser
      createOrg: typeof createOrg
      deleteOrg: typeof deleteOrg
      createInfluxDBUser: typeof createInfluxDBUser
      deleteInfluxDBUser: typeof deleteInfluxDBUser
      createInfluxDBRole: typeof createInfluxDBRole
      deleteInfluxDBRole: typeof deleteInfluxDBRole
      createInfluxDB: typeof createInfluxDB
      deleteInfluxDB: typeof deleteInfluxDB
    }
  }
}
