describe('Use Admin tab', () => {
  let url: string
  beforeEach(() => {
    cy.OAuthLogin('test')
    cy.removeConnections()
    cy.createConnection()
  })

  describe('Chronograf', () => {
    beforeEach(() => {
      cy.get('@connections').then(connections => {
        cy.fixture('routes').then(({adminChronograf}) => {
          url = `/sources/${connections[0].id}${adminChronograf}`
        })
      })
    })

    /* ADMIN TAB CHRONOGRAF */
  })

  describe('InfluxDB', () => {
    beforeEach(() => {
      cy.get('@connections').then(connections => {
        cy.fixture('routes').then(({adminInfluxDB}) => {
          url = `/sources/${connections[0].id}${adminInfluxDB}`
        })
      })
    })

    describe('Databases', () => {
      beforeEach(() => {
        cy.visit(url + '/databases')
      })

      it('create InfluxDB, edit it, and delete it', () => {
        const database = {
          name: 'New InfluxDB',
          retention: {
            name: 'New Retention',
            duration: '1h',
            durationChange: '1d',
          },
        }

        cy.getByTestID('create-db--button').click({force: true})
        cy.getByTestID('cancel').click({force: true})
        cy.getByTestID('create-db--button').click({force: true})
        cy.getByTestID('db-name--input').type(database.name)
        cy.getByTestID('confirm').click({force: true})
        cy.getByTestID(`db-manager--${database.name}`)
          .should('exist')
          .within(() => {
            cy.getByTestID('add-retention-policy--button').click({force: true})
            cy.getByTestID('cancel-rp--button').click({force: true})
            cy.getByTestID('add-retention-policy--button').click({force: true})
            cy.getByTestID('rp-name--input').type(database.retention.name)
            cy.getByTestID('rp-duration--input').type(
              database.retention.duration
            )
            cy.getByTestID('save-rp--button').click({force: true})
            cy.getByTestID(`db-manager-table--${database.name}`).within(() => {
              cy.getByTestID(`retention-policy--${database.retention.name}`)
                .should('exist')
                .within(() => {
                  cy.getByTestID('edit-rp--button').click({force: true})
                  cy.getByTestID('rp-duration--input')
                    .clear()
                    .type(database.retention.durationChange)
                  cy.getByTestID('save-rp--button').click({force: true})
                  cy.getByTestID('delete-rp--confirm-button').click({
                    force: true,
                  })
                })
            })

            cy.getByTestID('delete-db--button').click({force: true})
            cy.getByTestID('cancel').click({force: true})
            cy.getByTestID('delete-db--button').click({force: true})
            cy.getByTestID('delete-db--confirm-input').type(
              `DELETE ${database.name}`
            )
            cy.getByTestID('confirm').click({force: true})
          })

        cy.getByTestID(`db-manager--${database.name}`).should('not.exist')
      })
    })

    describe('Users', () => {
      beforeEach(() => {
        cy.visit(url + '/users')
      })

      const user = {
        name: 'Smiley',
        password: 'securePassword123',
      }
      const db = {
        name: '_internal',
        permission: {
          read: 'READ',
          write: 'WRITE',
        },
      }

      it('create user, edit permissions, change password, and delete user', () => {
        cy.get('.admin-table--compact > thead > tr')
          .find('th')
          .should('not.have.length', 3)
        cy.get('.dropdown--selected').click({force: true})
        cy.getByTestID('dropdown-menu').within(() => {
          cy.getByTestID('dropdown--item')
            .contains(db.name)
            .click({force: true})
        })
        cy.get('.dropdown--selected')
          .should('contain.text', db.name)
          .click({force: true})
        cy.get('.admin-table--compact > thead > tr')
          .find('th')
          .should('have.length', 3)
        cy.getByTestID('create-user--button').click()
        cy.getByTestID('cancel').click({force: true})
        cy.getByTestID('create-user--button').click()
        cy.getByTestID('username--input').type(user.name)
        cy.getByTestID('password--input').type(user.password)
        cy.getByTestID('confirm').click({force: true})
        cy.getByTestID(`user-row--${user.name}`).should('exist')
        cy.getByTestID('user-filter--input').type('Non existing user')
        cy.getByTestID(`user-row--${user.name}`).should('not.exist')
        cy.getByTestID('user-filter--input').clear()
        cy.getByTestID(`user-row--${user.name}`)
          .should('exist')
          .within(() => {
            cy.get('.admin--not-admin').should('contain.text', 'No')
            cy.getByTestID('permissions--values').within(() => {
              cy.getByTestID('read-permission').should('have.class', 'denied')
              cy.getByTestID('write-permission').should('have.class', 'denied')
            })
            cy.get('a').contains(user.name).click({force: true})
          })

        cy.getByTestID(`${db.name}-permissions--row`).within(() => {
          cy.getByTestID(
            `${db.name}-${db.permission.read}-permission--button`
          ).click({force: true})
          cy.getByTestID(
            `${db.name}-${db.permission.read}-permission--button`
          ).should('have.class', 'value-changed')
          cy.getByTestID(
            `${db.name}-${db.permission.write}-permission--button`
          ).click({force: true})
          cy.getByTestID(
            `${db.name}-${db.permission.write}-permission--button`
          ).should('have.class', 'value-changed')
        })

        cy.getByTestID('apply-changes--button').click({force: true})
        cy.getByTestID(`${db.name}-permissions--row`).within(() => {
          cy.getByTestID(`${db.name}-${db.permission.read}-permission--button`)
            .should('have.class', 'granted')
            .and('not.have.class', 'value-changed')
          cy.getByTestID(`${db.name}-${db.permission.write}-permission--button`)
            .should('have.class', 'granted')
            .and('not.have.class', 'value-changed')
        })

        cy.getByTestID(`${db.name}-permissions--row`).within(() => {
          cy.getByTestID(
            `${db.name}-${db.permission.write}-permission--button`
          ).click({force: true})
        })

        cy.getByTestID('apply-changes--button').click({force: true})
        cy.get('.notification-close').click({multiple: true, force: true})
        cy.getByTestID('change-password--button').click({force: true})
        cy.getByTestID('cancel').click({force: true})
        cy.getByTestID('change-password--button').click({force: true})
        cy.getByTestID('new-password--input').type(user.password)
        cy.getByTestID('confirm').click({force: true})
        cy.getByTestID('exit--button').click({force: true})
        cy.getByTestID(`user-row--${user.name}`).within(() => {
          cy.getByTestID('permissions--values')
            .eq(0)
            .within(() => {
              cy.getByTestID('read-permission').should('have.class', 'granted')
              cy.getByTestID('write-permission').should('have.class', 'denied')
            })

          cy.get('a').contains(user.name).click({force: true})
        })

        cy.getByTestID('delete-user--button').click({force: true})
        cy.getByTestID('confirm-btn')
          .contains('Confirm')
          .should('be.visible')
          .click({force: true})
        cy.getByTestID(`user-row--${user.name}`).should('not.exist')
      })

      it('create user, grant admin, revoke admin, and delete user', () => {
        cy.getByTestID('create-user--button').click()
        cy.getByTestID('username--input').type(user.name)
        cy.getByTestID('password--input').type(user.password)
        cy.getByTestID('confirm').click({force: true})
        cy.getByTestID(`user-row--${user.name}`)
          .should('exist')
          .within(() => {
            cy.get('.admin--not-admin').should('contain.text', 'No')
            cy.getByTestID('permissions--values')
              .eq(0)
              .within(() => {
                cy.getByTestID('read-permission').should('have.class', 'denied')
                cy.getByTestID('write-permission').should(
                  'have.class',
                  'denied'
                )
              })

            cy.get('a').contains(user.name).click({force: true})
          })
        cy.getByTestID('grant-admin--button').click({force: true})
        cy.getByTestID('confirm-btn')
          .contains('Grant ALL Privileges')
          .should('be.visible')
          .click({force: true})
        cy.getByTestID('user-is-admin--text').should('exist')
        cy.getByTestID('exit--button').click({force: true})
        cy.getByTestID(`user-row--${user.name}`).within(() => {
          cy.get('.admin--is-admin').should('contain.text', 'Yes')
          cy.getByTestID('permissions--values')
            .eq(0)
            .within(() => {
              cy.getByTestID('read-permission').should('have.class', 'granted')
              cy.getByTestID('write-permission').should('have.class', 'granted')
            })

          cy.get('a').contains(user.name).click({force: true})
        })

        cy.getByTestID('revoke-admin--button').click({force: true})
        cy.getByTestID('confirm-btn')
          .contains('Revoke ALL Privileges')
          .click({force: true})
        cy.getByTestID('exit--button').click({force: true})
        cy.getByTestID(`user-row--${user.name}`).within(() => {
          cy.get('.admin--not-admin').should('contain.text', 'No')
          cy.getByTestID('permissions--values')
            .eq(0)
            .within(() => {
              cy.getByTestID('read-permission').should('have.class', 'denied')
              cy.getByTestID('write-permission').should('have.class', 'denied')
            })

          cy.get('a').contains(user.name).click({force: true})
        })

        cy.getByTestID('delete-user--button').click({force: true})
        cy.getByTestID('confirm-btn')
          .contains('Confirm')
          .should('be.visible')
          .click({force: true})
        cy.getByTestID(`user-row--${user.name}`).should('not.exist')
      })
    })

    describe('Queries', () => {
      beforeEach(() => {
        cy.visit(url + '/queries')
      })

      it('test', () => {
        cy.get('body')
      })
    })
  })
})
