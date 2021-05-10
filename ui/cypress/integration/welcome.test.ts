function createConnectionV1(url: string,
                            connectionName: string,
                            username: string,
                            password: string,
                            dbname: string,
) {
    cy.get('input[id="Connection URL"]').clear().type(url)
    cy.get('input[id="Connection Name"]').clear()
    cy.wait(3000)
    cy.get('input[id="Connection Name"]').clear().type(connectionName)
    cy.get('input[id="Username"]').clear().type(username)
    cy.wait(3000)
    cy.get('input[id="Password"]').clear().type(password)
    cy.get('input[id="Telegraf Database Name"]').clear().type(dbname)
    cy.get('input[id="Default Retention Policy"]').clear()
}

function createConnectionV2(url: string,
                            connectionName: string,
                            organization: string,
                            token: string,
                            dbname: string,
) { 
    cy.get('div[title="Default connection"]').click()
    cy.get('div[title="InfluxDB v2 Auth"]').click()
    cy.get('input[id="Connection URL"]').clear().type(url)
    cy.get('input[id="Connection Name"]').clear().type(connectionName)
    cy.get('input[id="Organization"]').clear().type(organization)
    cy.wait(2000)
    cy.get('input[id="Token"]').clear().type(token)
    cy.get('input[id="Telegraf Database Name"]').clear().type(dbname)
cy.get('input[id="Default Retention Policy"]').clear()
}

context('Navigate', () => {
    beforeEach(() => {
        cy.visit('http://localhost:8888/')
        cy.get('h1').then(($a) => {
            if ($a.text().includes('Welcome to Chronograf')) {
                //initialize connections v1
                cy.get('.wizard-button-bar').contains("Get Started").click()
                createConnectionV1('http://localhost:8086', "InfluxTest1", "admin", "admin", "telegraf")
                cy.get('.wizard-button-bar').contains("Add Connection").click()
                cy.get('.notification-message').should('have.text',
                    "Connected to InfluxDB InfluxTest1 successfully.")
                cy.wait(2000)
                cy.get('.notification-close').click()
                cy.get('button').contains("Next").click()
                //kapacitor skip
                cy.get('button').contains("Skip").click()
                //setup complete
                cy.get('button').contains("View All Connections").click()
                cy.get('h1.page-header--title').should('have.text','Configuration')

                //add connection v2
                cy.clickNav(8, 'Configuration')
                cy.get("div.btn").contains(" Add Connection").click()
                createConnectionV2("http://localhost:9999", "InfluxTest2", "my-org", "my-token", "telegraf");
                cy.get('.wizard-button-bar').contains("Add Connection").click()
                cy.get('.notification-message').should('have.text',
                    "Connected to InfluxDB InfluxTest2 successfully.")
                cy.get('.notification-close').click()
                cy.get('button').contains("Next").click()
                //kapacitor skip
                cy.get('button').contains("Skip").click()
                cy.get('button').contains("Finish").click()
            }
        })
    })

    it('HostList', () => {
        cy.clickNav(2, 'Host List')
        cy.clickNav(1, 'Status')
    })

    it('Explore', () => {
        cy.clickNav(3, 'Explore')
        cy.wait(2000)
        cy.clickNav(1, 'Status')
        cy.wait(2000)
    })

    it('Dashboards', () => {
        cy.clickNav(4, 'Dashboards')
        cy.wait(3000)
        cy.clickNav(1, 'Status')
        cy.wait(2000)
    })

    it('Manage Tasks', () => {
        cy.clickNav(5, 'Manage Tasks')
        cy.clickNav(1, 'Status')
        cy.wait(2000)
    })

    it('Log Viewer', () => {
        cy.clickNav(6, 'Log Viewer')
        cy.clickNav(1, 'Status')
    })

    it('InfluxDB Admin', () => {
        cy.clickNav(7, 'InfluxDB Admin')
        cy.clickNav(1, 'Status')
    })

    it('Configuration', () => {
        cy.clickNav(8, 'Configuration')
        cy.clickNav(1, 'Status')
    })

})
