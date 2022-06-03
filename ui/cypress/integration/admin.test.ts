describe('Use Admin tab', () => {
  let url: string
  let sourceId: string

  beforeEach(() => {
    cy.OAuthLogin('test').then(() => {
      cy.removeConnections()
      cy.createConnection()
      cy.get('@connections').then(source => {
        sourceId = source[0].id
      })
    })
  })

  //   describe('Chronograf', () => {
  //     beforeEach(() => {
  //       cy.fixture('routes').then(({adminChronograf}) => {
  //         url = `/sources/${sourceId}${adminChronograf}`
  //       })
  //     })

  //     /* ADMIN TAB CHRONOGRAF */
  //   })

  describe.only('InfluxDB', () => {
    beforeEach(() => {
      cy.fixture('routes').then(({adminInfluxDB}) => {
        url = `/sources/${sourceId}${adminInfluxDB}`
      })
    })

    describe('Databases', () => {
      const database = {
        name: 'New InfluxDB',
        retention: {
          name: 'New Retention',
          duration: '1h',
          durationChange: '1d',
        },
      }

      beforeEach(() => {
        cy.deleteInfluxDB(database.name, sourceId)
        cy.visit(url + '/databases')
      })

      it.only('create InfluxDB, edit it, and delete it', () => {
        cy.getByTestID('create-db--button').click({force: true})
        cy.getByTestID('cancel').click({force: true})
        cy.getByTestID('create-db--button').click({force: true})
        cy.getByTestID('db-name--input').type(database.name)
        cy.getByTestID('confirm').click({force: true})
        cy.get('.db-manager--edit').should('not.exist')
        cy.getByTestID(`db-manager--${database.name}`)
          .should('exist')
          .within(() => {
            cy.getByTestID('db-manager--header').should(
              'contain',
              database.name
            )
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
      const user = {
        name: 'Smiley',
        password: 'securePassword123',
      }
      const db = {
        name: '_internal',
        permission: {
          read: 'ReadData',
          write: 'WriteData',
        },
      }
      const role = {
        name: 'Sunny',
        permissions: {},
        users: {},
      }

      beforeEach(() => {
        cy.deleteInfluxDBUser(user.name, sourceId)
        cy.visit(url + '/users')
      })

      it('create user, edit permissions, change password, and delete user', () => {
        cy.get('.dropdown--selected').click({force: true})
        cy.getByTestID('dropdown-menu').within(() => {
          cy.getByTestID('dropdown--item')
            .contains(db.name)
            .click({force: true})
        })
        cy.get('.dropdown--selected')
          .should('contain.text', db.name)
          .click({force: true})

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

      it('create user, assign role, remove role, and delete user', () => {
        cy.deleteInfluxDBRole(role.name, sourceId)
        cy.createInfluxDBRole(role.name, sourceId)
        cy.createInfluxDBUser(user.name, user.password, sourceId)

        cy.get('.dropdown--selected').click({force: true})
        cy.getByTestID('dropdown-menu').within(() => {
          cy.getByTestID('dropdown--item')
            .contains(db.name)
            .click({force: true})
        })

        cy.getByTestID(`user-row--${user.name}`)
          .should('exist')
          .within(() => {
            cy.getByTestID('roles-granted').should(
              'not.contain.text',
              role.name
            )
            cy.get('a').contains(user.name).click({force: true})
          })

        cy.getByTestID(`role-${role.name}--button`).click({force: true})
        cy.getByTestID(`role-${role.name}--button`).should(
          'have.class',
          'value-changed'
        )
        cy.getByTestID('apply-changes--button').click({force: true})
        cy.getByTestID(`role-${role.name}--button`).should(
          'not.have.class',
          'value-changed'
        )
        cy.getByTestID('exit--button').click({force: true})
        cy.getByTestID('roles-granted').within(() => {
          cy.get('.role-value').contains(role.name).should('exist')
        })
      })
    })

    // describe('Queries', () => {
    //   beforeEach(() => {
    //     cy.visit(url + '/queries')
    //   })

    //   it('IN PROGRESS', () => {
    //     cy.get('body')
    //   })
    // })
  })
})
