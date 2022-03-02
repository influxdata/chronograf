describe('query builder', () => {
  beforeEach(() => {
    cy.deleteDashboards()
    cy.cutConnections()
    cy.createConnection()
    cy.createDashboard()

    cy.get('@connections').then(connections => {
      cy.get('@dashboards').then(dashboards => {
        cy.fixture('routes').then(routes => {
          cy.visit(
            `/sources/${connections[0].id}${routes.dashboards}/${dashboards[0].id}`
          )
        })
      })
    })

    cy.get('#Line').click()
    cy.get('.dash-graph').contains('Add Data').click()
    cy.get('.source-selector').within(() => {
      cy.get('@connections').then(connections => {
        cy.get('.dropdown--selected').should('have.text', 'Dynamic Source')
        cy.get('.dropdown--button').click()
        cy.get('.dropdown--menu').contains(connections[0].name).click()
        cy.get('.dropdown--selected').should('have.text', connections[0].name)
      })

      cy.get('button').contains('Flux').click().should('have.class', 'active')
    })

    cy.get('button').contains('Query Builder').click()
  })

  it.only('create a query, change its aggregation function and fill missing values', () => {
    let clusterID: string
    let queryTemplate: string

    cy.get('[data-testid="bucket-selector"]').within(() => {
      cy.get('.flux-query-builder--list-item').contains('internal').click()
    })

    cy.get('[data-testid="builder-card"]')
      .eq(0)
      .within(() => {
        cy.get('#flxts0_database').should('exist').click({force: true})
      })

    cy.get('[data-testid="builder-card"]')
      .eq(1)
      .within(() => {
        cy.get('.flux-query-builder--list-item')
          .should('exist')
          .click({force: true})
          .then(value => {
            clusterID = value.text()
          })
      })

    const checkQuery = (queryTemplate: string): void => {
      cy.get('.flux-query-builder--actions')
        .contains('Query Editor')
        .click({force: true})
      cy.get('.flux-script-wizard--bg-hint')
        .should('not.exist')
        .then(() => {
          cy.get('.CodeMirror-line').then(lines =>
            expect(lines.text()).to.be.equal(queryTemplate)
          )
        })

      cy.get('button').contains('Query Builder').click({force: true})
    }

    cy.get('.flux-query-builder--actions')
      .contains('Submit')
      .click()
      .then(() => {
        queryTemplate =
          'from(bucket: "_internal/monitor")' +
          '  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)' +
          '  |> filter(fn: (r) => r["_measurement"] == "database")' +
          `  |> filter(fn: (r) => r["clusterID"] == "${clusterID}")` +
          '  |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)' +
          '  |> yield(name: "mean")'

        checkQuery(queryTemplate)
      })

    cy.get('[data-testid="aggregation-selector"]').within(() => {
      cy.get('[data-testid="builder-card--body"]').within(() => {
        cy.get('.dropdown-selected').click()
        cy.get('.dropdown-menu').within(() => {
          cy.getByTestID('dropdown-item').contains('custom').click({force: true})
        })
        cy.get('input').type('13s{enter}')
        cy.get('.dropdown-selected').should('contain.text', '13s')
        cy.get('.slide-toggle').click().should('have.class', 'active')
      })

      cy.get('.builder-card--contents').within(() => {
        cy.get('#flx-agrselectmean').click()

        // Temporarily jump outside the builder-card--body element scope to check whether or not notification error message popped up
        cy.document()
          .its('body')
          .within(() => {
            cy.get('.notification-error')
              .should('exist')
              .and(
                'have.text',
                'You must have at least one aggregation function selected'
              )
          })

        cy.get('#flx-agrselectmax').click()
        cy.get('#flx-agrselectmean').click()
      })
    })

    cy.get('[data-testid="builder-card"]')
      .eq(2)
      .should('contain.text', 'Filter')
      .within(() => {
        cy.get('.dropdown-selected').contains('Filter').click()
        cy.get('.dropdown-item').contains('Group').click()
        cy.get('.dropdown-selected').should('contain.text', 'Group')
        cy.get('.flux-query-builder--list-item')
          .contains('time')
          .click({force: true})
      })

    cy.get('.flux-query-builder--actions')
      .contains('Submit')
      .click()
      .then(() => {
        queryTemplate =
          'from(bucket: "_internal/monitor")' +
          '  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)' +
          '  |> filter(fn: (r) => r["_measurement"] == "database")' +
          `  |> filter(fn: (r) => r["clusterID"] == "${clusterID}")` +
          '  |> group(columns: ["_time"])' +
          '  |> aggregateWindow(every: 13s, fn: max, createEmpty: true)' +
          '  |> yield(name: "max")'

        checkQuery(queryTemplate)
      })
  })

  it('use filters to search for tags, activate them and keep track of the selected tags counter', () => {
    cy.get('[data-testid="bucket-selector"]').within(() => {
      cy.get('.flux-query-builder--list-item').should('have.length', 1)
      cy.get('[data-testid="builder-card--menu"]').type('Hello World')
      cy.get('.flux-query-builder--list-item').should('not.exist')
      cy.get('[data-testid="builder-card--menu"]').clear()
      cy.get('.flux-query-builder--list-item')
        .should('have.length', 1)
        .and('contain.text', 'internal')
    })

    cy.get('[data-testid="builder-card"]').within(() => {
      cy.get('.flux-tag-selector--count').should('not.exist')
      cy.get('.flux-query-builder--list-item')
        .contains('database')
        .click({force: true})
      cy.get('.flux-tag-selector--count').should('have.text', 1)
      cy.get('.flux-query-builder--list-item')
        .contains('cluster')
        .click({force: true})
      cy.get('.flux-tag-selector--count').should('have.text', 2)
      cy.get('.flux-query-builder--list-item')
        .contains('database')
        .click({force: true})
      cy.get('.flux-tag-selector--count').should('have.text', 1)
      cy.get('.flux-query-builder--list-item')
        .contains('cluster')
        .click({force: true})
      cy.get('.flux-tag-selector--count').should('not.exist')
    })
  })

  it('add and remove building card', () => {
    cy.get('.builder-card--list').within(() => {
      cy.get('.builder-card').should('have.length', 2)
      cy.get('.flux-query-builder--add-card-button').click()
      cy.get('.flux-query-builder--add-card-button').click()

      cy.get('.builder-card')
        .should('have.length', 4)
        .eq(3)
        .within(() => {
          cy.get('.builder-card--delete').click({force: true})
        })
      cy.get('.builder-card')
        .should('have.length', 3)
        .eq(2)
        .within(() => {
          cy.get('.builder-card--delete').click({force: true})
        })
      cy.get('.builder-card').should('have.length', 2)
    })
  })
})
