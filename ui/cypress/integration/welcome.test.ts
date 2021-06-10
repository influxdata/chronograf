context('Navigate', () => {
    beforeEach(cy.setupConnection)

    it('HostList', () => {
        cy.clickNav(2, 'Host List')
        cy.clickNav(1, 'Status')
    })

    it('Explore', () => {
        cy.clickNav(3, 'Explore')
        cy.clickNav(1, 'Status')
    })

    it('Dashboards', () => {
        cy.clickNav(4, 'Dashboards')
        cy.clickNav(1, 'Status')
    })

    it('Manage Tasks', () => {
        cy.clickNav(5, 'Manage Tasks')
        cy.clickNav(1, 'Status')
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
