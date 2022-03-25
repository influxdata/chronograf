/* eslint @typescript-eslint/no-unused-vars: "off" */
import 'jest'

import {
  getByTestID,
  cutConnections,
  createConnection,
  createDashboard,
  deleteDashboards,
} from './support/commands'

declare global {
  namespace Cypress {
    interface Chainable {
      getByTestID: typeof getByTestID
      cutConnections: typeof cutConnections
      createConnection: typeof createConnection
      createDashboard: typeof createDashboard
      deleteDashboards: typeof deleteDashboards
    }
  }
}
