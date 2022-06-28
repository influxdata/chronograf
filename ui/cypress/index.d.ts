import 'jest'

import {
  getByTestID,
  removeInfluxDBConnections,
  createInfluxDBConnection,
  createDashboard,
  deleteDashboards,
  createDashboardWithCell,
  OAuthLogin,
  OAuthLogout,
  OAuthLoginAsDiffUser,
  createChronografUser,
  deleteChronografUser,
  deleteChronografUsers,
  createOrg,
  deleteOrg,
  deleteOrgs,
  createInfluxDBUser,
  deleteInfluxDBUser,
  deleteInfluxDBUsers,
  createInfluxDBRole,
  deleteInfluxDBRole,
  deleteInfluxDBRoles,
  createInfluxDB,
  deleteInfluxDB,
  deleteInfluxDBs,
  toInitialState,
  writePoints,
  clickAttached,
  changeUserInfo,
} from './support/commands'

declare global {
  namespace Cypress {
    interface Chainable {
      getByTestID: typeof getByTestID
      removeInfluxDBConnections: typeof removeInfluxDBConnections
      createInfluxDBConnection: typeof createInfluxDBConnection
      createDashboard: typeof createDashboard
      deleteDashboards: typeof deleteDashboards
      createDashboardWithCell: typeof createDashboardWithCell
      OAuthLogin: typeof OAuthLogin
      OAuthLogout: typeof OAuthLogout
      OAuthLoginAsDiffUser: typeof OAuthLoginAsDiffUser
      createChronografUser: typeof createChronografUser
      deleteChronografUser: typeof deleteChronografUser
      deleteChronografUsers: typeof deleteChronografUsers
      createOrg: typeof createOrg
      deleteOrg: typeof deleteOrg
      deleteOrgs: typeof deleteOrgs
      createInfluxDBUser: typeof createInfluxDBUser
      deleteInfluxDBUser: typeof deleteInfluxDBUser
      deleteInfluxDBUsers: typeof deleteInfluxDBUsers
      createInfluxDBRole: typeof createInfluxDBRole
      deleteInfluxDBRole: typeof deleteInfluxDBRole
      deleteInfluxDBRoles: typeof deleteInfluxDBRoles
      createInfluxDB: typeof createInfluxDB
      deleteInfluxDB: typeof deleteInfluxDB
      deleteInfluxDBs: typeof deleteInfluxDBs
      toInitialState: typeof toInitialState
      writePoints: typeof writePoints
      clickAttached: typeof clickAttached
      changeUserInfo: typeof changeUserInfo
    }
  }
}
