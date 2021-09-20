import {addMatchImageSnapshotCommand} from 'cypress-image-snapshot/command'

declare namespace Cypress {
  interface Chainable<Subject> {
    /**
     * Custom command to match image snapshots.
     * @example cy.matchImageSnapshot('greeting')
     */
    matchImageSnapshot(snapshotName?: string): void;
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

Cypress.Commands.overwrite('matchImageSnapshot', (originalFn, snapshotName, options) => {
  if (Cypress.env('ALLOW_SCREENSHOT')) {
    originalFn(snapshotName, options)
  } else {
    cy.log(`Screenshot comparison is disabled`)
  }
})

export const clickNav = (index: number, label: string): Cypress.Chainable => {
  cy.get(`:nth-child(${index}) > .sidebar--square`).click()
  return cy.get('h1.page-header--title').should('have.text', `${label}`)
}

export const getByTestID = (
  dataTest: string,
  options?: Partial<
    Cypress.Loggable & Cypress.Timeoutable & Cypress.Withinable & Cypress.Shadow
  >
): Cypress.Chainable => {
  return cy.get(`[data-test="${dataTest}"]`, options)
}

export const getByTitle = (name: string): Cypress.Chainable => {
  return cy.get(`[title="${name}"]`)
}

function createConnectionV2(url: string,
  connectionName: string,
  organization: string,
  token: string,
  dbname: string,
) {
cy.get('div[title="InfluxDB v2 Auth"]').click()
cy.get('input[id="Connection URL"]').clear().type(url)
cy.get('input[id="Connection Name"]').clear().type(connectionName)
cy.get('input[id="Organization"]').clear().type(organization)
cy.get('input[id="Token"]').clear().type(token)
cy.get('input[id="Telegraf Database Name"]').clear().type(dbname)
cy.get('input[id="Default Retention Policy"]').clear()
}


export const setupConnection = () => {
  cy.visit('/')
  // cy.waitFor('#tooltip', {timeout: 20000});
  cy.get('h1', {timeout: 10000}).should('be.visible')
  cy.get('h1').then($a => {
    if ($a.text().includes('Welcome to Chronograf')) {
      // initialize connections v2
      cy.get('.wizard-button-bar').contains('Get Started').click()
      createConnectionV2(
        'http://localhost:9999',
        'InfluxTest2',
        'my-org',
        'my-token',
        'telegraf'
      )
      cy.get('.wizard-button-bar').contains('Add Connection').click()
      cy.get('.notification-message').should(
        'have.text',
        'Connected to InfluxDB InfluxTest2 successfully.'
      )
      cy.get('.notification-close').click()
      cy.get('button').contains('Next').click()
      //kapacitor skip
      cy.get('button').contains('Skip').click()
      //setup complete
      cy.get('button').contains('View All Connections').click()
      cy.get('h1.page-header--title').should('have.text', 'Configuration')

    }
  })
}

export const writeManualData = (
  fieldKey: string,
  dataValue: string) => {
  cy.get('[data-test=write-data-button]').click()
  cy.get('[data-test=dropdown-toggle]').first().click()

  cy.get('[data-test="dropdown-item"]').filter(':contains("my-bucket")').click()

  cy.getByTitle('Write data manually using Line Protocol').click()
  cy.get('[data-test=manual-entry-field]')
    .clear()
    .type(fieldKey + ' ' + dataValue)
  cy.get('[data-test="write-data-submit-button"]', {timeout: 10000}).click()
  cy.wait(2000)
}

Cypress.Commands.add('clickNav', clickNav)
Cypress.Commands.add('setupConnection', setupConnection)
Cypress.Commands.add('getByTestID', getByTestID)
Cypress.Commands.add('getByTitle', getByTitle)
Cypress.Commands.add('writeManualData', writeManualData)
