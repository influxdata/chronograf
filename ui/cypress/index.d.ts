/* eslint @typescript-eslint/no-unused-vars: "off" */
import 'jest'

import {
  clickNav,
  getByTestID
} from './support/commands'

declare global {
  namespace Cypress {
    interface Chainable {
      clickNav: typeof clickNav
      getByTestID: typeof getByTestID
    }
  }
}
