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
  createUser,
  deleteUser,
  createOrg,
  deleteOrg  
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
      createUser: typeof createUser
      deleteUser: typeof deleteUser
      createOrg: typeof createOrg
      deleteOrg: typeof deleteOrg
    }
  }
}
