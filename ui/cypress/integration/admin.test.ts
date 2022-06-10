describe('Use Admin tab', () => {
  let url: string
  let sourceId: string

  beforeEach(() => {
    cy.flush()
    cy.createInfluxDBConnection()
    cy.get('@connections').then(source => {
      sourceId = source[0].id
      cy.request('GET', `/chronograf/v1/sources/${sourceId}/users`)
        .then(({body: responseBody}) => {
          console.log(responseBody.users)
        })
    })
    
  })

  describe('InfluxDB', () => {
<<<<<<< HEAD
    const user = {
      name: 'Smiley',
      password: 'securePassword123',
    }
    const db = {
      name: 'New InfluxDB',
      retention: {
        name: 'New Retention',
        duration: '1h',
        durationChange: '1d',
      },
      permissions: {read: 'ReadData', write: 'WriteData'},
    }
    const role = {
      name: 'Sunny',
      permissions: ['ReadData', 'WriteData'],
      users: {},
    }
=======
    let influxDB: any

    before(() => {
      cy.fixture('influxDB').then(influxDBData => {
        influxDB = influxDBData
      })
    })
>>>>>>> feat(cypress): improve quality of tests

    beforeEach(() => {
      cy.deleteInfluxDB(influxDB.db.name, sourceId)
      url = `/sources/${sourceId}/admin-influxdb`
    })

    describe('Databases', () => {
      beforeEach(() => {
        cy.visit(url + '/databases')
      })

      it('create InfluxDB, edit it, and delete it', () => {
        cy.getByTestID('create-db--button').click({force: true})
        cy.getByTestID('cancel').click({force: true})
        cy.getByTestID('create-db--button').click({force: true})
        cy.getByTestID('db-name--input').type(influxDB.db.name)
        cy.getByTestID('confirm').click({force: true})
        cy.get('.db-manager--edit').should('not.exist')
        cy.getByTestID(`db-manager--${influxDB.db.name}`)
          .should('exist')
          .within(() => {
            cy.getByTestID('db-manager--header').should(
              'contain',
              influxDB.db.name
            )
            cy.getByTestID('add-retention-policy--button').click({force: true})
            cy.getByTestID('cancel-rp--button').click({force: true})
            cy.getByTestID('add-retention-policy--button').click({force: true})
            cy.getByTestID('rp-name--input').type(influxDB.db.retentionPolicies[0].name)
            cy.getByTestID('rp-duration--input').type(
              influxDB.db.retentionPolicies[0].duration
            )
            cy.getByTestID('save-rp--button').click({force: true})
            cy.getByTestID(`db-manager-table--${influxDB.db.name}`).within(
              () => {
                cy.getByTestID(
                  `retention-policy--${influxDB.db.retentionPolicies[0].name}`
                )
                  .should('exist')
                  .within(() => {
                    cy.getByTestID('edit-rp--button').click({force: true})
                    cy.getByTestID('rp-duration--input')
                      .clear()
                      .type(influxDB.db.retentionPolicies[0].shardDuration)
                    cy.getByTestID('save-rp--button').click({force: true})
                    cy.getByTestID('delete-rp--confirm-button').click({
                      force: true,
                    })
                  })
              }
            )

            cy.getByTestID('delete-db--button').click({force: true})
            cy.getByTestID('cancel').click({force: true})
            cy.getByTestID('delete-db--button').click({force: true})
            cy.getByTestID('delete-db--confirm-input').type(
              `DELETE ${influxDB.db.name}`
            )
            cy.getByTestID('confirm').click({force: true})
          })

        cy.getByTestID(`db-manager--${influxDB.db.name}`).should('not.exist')
      })
    })

    describe('Users', () => {
      beforeEach(() => {
<<<<<<< HEAD
        cy.deleteInfluxDBUser(user.name, sourceId)
        cy.createInfluxDB(db.name, sourceId)
=======
        cy.createInfluxDB(influxDB.db.name, sourceId)
>>>>>>> feat(cypress): improve quality of tests
        cy.visit(url + '/users')
      })

      it('create user, edit permissions, change password, and delete user', () => {
        cy.get('.dropdown--selected').click({force: true})
        cy.getByTestID('dropdown-menu').within(() => {
          cy.getByTestID('dropdown--item')
            .contains(influxDB.db.name)
            .click({force: true})
        })
        cy.get('.dropdown--selected')
          .should('contain.text', influxDB.db.name)
          .click({force: true})

        cy.getByTestID('create-user--button').click()
        cy.getByTestID('dismiss-button').click({force: true})
        cy.getByTestID('create-user--button').click()
        cy.get('button').contains('Cancel').click({force: true})
        cy.getByTestID('create-user--button').click()
        cy.get('button').contains('Create').should('be.disabled')
<<<<<<< HEAD
        cy.getByTestID('username--input').type(user.name)
        cy.getByTestID('password--input').type(user.password)
=======
        cy.getByTestID('username--input').type(influxDB.user.name)
        cy.getByTestID('password--input').type(influxDB.user.password)
>>>>>>> feat(cypress): improve quality of tests
        cy.get('button')
          .contains('Create')
          .should('not.be.disabled')
          .click({force: true})
        cy.getByTestID('exit--button').click({force: true})
        cy.getByTestID(`user-row--${influxDB.user.name}`).should('exist')
        cy.getByTestID('user-filter--input').type('Non existing user')
        cy.getByTestID(`user-row--${influxDB.user.name}`).should('not.exist')
        cy.getByTestID('user-filter--input').clear()
        cy.getByTestID(`user-row--${influxDB.user.name}`)
          .should('exist')
          .within(() => {
            cy.getByTestID('permissions--values').within(() => {
              cy.getByTestID('read-permission').should('have.class', 'denied')
              cy.getByTestID('write-permission').should('have.class', 'denied')
            })
            cy.get('a').contains(influxDB.user.name).click({force: true})
          })

<<<<<<< HEAD
        cy.getByTestID(`${db.name}-permissions--row`).within(() => {
          cy.getByTestID(
            `${db.name}-${db.permissions.read}-permission--button`
          ).click({force: true})
          cy.getByTestID(
            `${db.name}-${db.permissions.read}-permission--button`
          ).should('have.class', 'value-changed')
          cy.getByTestID(
            `${db.name}-${db.permissions.write}-permission--button`
          ).click({force: true})
          cy.getByTestID(
            `${db.name}-${db.permissions.write}-permission--button`
          ).should('have.class', 'value-changed')
        })

        cy.getByTestID('apply-changes--button').click({force: true})
        cy.getByTestID(`${db.name}-permissions--row`).within(() => {
          cy.getByTestID(`${db.name}-${db.permissions.read}-permission--button`)
            .should('have.class', 'granted')
            .and('not.have.class', 'value-changed')
          cy.getByTestID(
            `${db.name}-${db.permissions.write}-permission--button`
          )
            .should('have.class', 'granted')
            .and('not.have.class', 'value-changed')
        })

        cy.getByTestID(`${db.name}-permissions--row`).within(() => {
          cy.getByTestID(
            `${db.name}-${db.permissions.write}-permission--button`
          ).click({force: true})
=======
        cy.getByTestID(`${influxDB.db.name}-permissions--row`).within(() => {
          influxDB.user.db[0].permissions.forEach((permission: any) => {
            cy.getByTestID(
              `${influxDB.user.db[0].name}-${permission}-permission--button`
            )
              .click({force: true})
              .should('have.class', 'value-changed')
          })
        })

        cy.getByTestID('apply-changes--button').click({force: true})
        cy.getByTestID(`${influxDB.db.name}-permissions--row`).within(() => {
          influxDB.user.db[0].permissions.forEach((permission: any) => {
            cy.getByTestID(
              `${influxDB.user.db[0].name}-${permission}-permission--button`
            )
              .should('have.class', 'granted')
              .and('not.have.class', 'value-changed')
          })
>>>>>>> feat(cypress): improve quality of tests
        })

        cy.get('.notification-close').click({multiple: true, force: true})
        cy.getByTestID('change-password--button').click({force: true})
        cy.getByTestID('cancel').click({force: true})
        cy.getByTestID('change-password--button').click({force: true})
        cy.getByTestID('new-password--input').type(influxDB.user.password)
        cy.getByTestID('confirm').click({force: true})
        cy.getByTestID('exit--button').click({force: true})
        cy.getByTestID(`user-row--${influxDB.user.name}`).within(() => {
          cy.getByTestID('permissions--values')
            .eq(1)
            .within(() => {
              cy.getByTestID('read-permission').should('have.class', 'granted')
              cy.getByTestID('write-permission').should('have.class', 'granted')
            })

          cy.get('a').contains(influxDB.user.name).click({force: true})
        })

        cy.getByTestID('delete-user--button').click({force: true})
        cy.getByTestID('confirm-btn')
          .contains('Confirm')
          .should('be.visible')
          .click({force: true})
        cy.getByTestID(`user-row--${influxDB.user.name}`).should('not.exist')
      })

      it('create user, assign role, remove role, and delete user', () => {
        cy.deleteInfluxDBRole(influxDB.role.name, sourceId)
        cy.createInfluxDBRole(influxDB.role.name, sourceId)
        cy.getByTestID('create-user--button').click()
        cy.get('button').contains('Create').should('be.disabled')
<<<<<<< HEAD
        cy.getByTestID('username--input').type(user.name)
        cy.getByTestID('password--input').type(user.password)
=======
        cy.getByTestID('username--input').type(influxDB.user.name)
        cy.getByTestID('password--input').type(influxDB.user.password)
>>>>>>> feat(cypress): improve quality of tests
        cy.get('button')
          .contains('Create')
          .should('not.be.disabled')
          .click({force: true})
        cy.getByTestID('exit--button').click({force: true})
        cy.get('.dropdown--selected').click({force: true})
        cy.getByTestID('dropdown-menu').within(() => {
          cy.getByTestID('dropdown--item')
            .contains(influxDB.db.name)
            .click({force: true})
        })

        cy.getByTestID(`user-row--${influxDB.user.name}`)
          .should('exist')
          .within(() => {
            cy.getByTestID('roles-granted').should(
              'not.contain.text',
              influxDB.role.name
            )
            cy.get('a').contains(influxDB.user.name).click({force: true})
          })

        cy.getByTestID(`role-${influxDB.role.name}--button`).click({
          force: true,
        })
        cy.getByTestID(`role-${influxDB.role.name}--button`).should(
          'have.class',
          'value-changed'
        )
        cy.getByTestID('apply-changes--button').click({force: true})
        cy.getByTestID(`role-${influxDB.role.name}--button`).should(
          'not.have.class',
          'value-changed'
        )
        cy.getByTestID('exit--button').click({force: true})
        cy.getByTestID('roles-granted').within(() => {
          cy.get('.role-value').contains(influxDB.role.name).should('exist')
        })
      })
    })

    describe('Roles', () => {
      beforeEach(() => {
        cy.deleteInfluxDBRole(role.name, sourceId)
        cy.deleteInfluxDBUser(user.name, sourceId)
        cy.deleteInfluxDB(db.name, sourceId)
        cy.createInfluxDB(db.name, sourceId)
        cy.createInfluxDBUser(user.name, user.password, sourceId)
        cy.visit(url + '/roles')
      })

      it('create a role, edit it, assign it to a user, and delete it', () => {
        cy.getByTestID('admin-table--head').within(() => {
          cy.get('th').contains('Users').should('exist')
        })

        cy.getByTestID('hide-users--toggle').click()
        cy.getByTestID('admin-table--head').within(() => {
          cy.get('th').contains('Users').should('not.exist')
        })

        cy.getByTestID(`role-${role.name}--row`).should('not.exist')
        cy.getByTestID('create-role--button').click({force: true})
        cy.getByTestID('dismiss-button').click()
        cy.getByTestID('create-role--button').click({force: true})
        cy.getByTestID('form--cancel-role--button').click()
        cy.getByTestID('create-role--button').click({force: true})
        cy.getByTestID('form--create-role--button').should('be.disabled')
        cy.getByTestID('role-name--input').type(role.name)
        cy.getByTestID('form--create-role--button')
          .should('not.be.disabled')
          .click()
        cy.getByTestID('exit--button').click({force: true})
        cy.getByTestID(`role-${role.name}--row`)
          .should('exist')
          .within(() => {
            cy.get('a').contains(role.name).click({force: true})
          })

        cy.getByTestID(`user-${user.name}--selector`)
          .should('not.have.class', 'value-changed')
          .click({force: true})
          .should('have.class', 'value-changed')

        cy.getByTestID(`${db.name}-db-perm--row`).within(() => {
          role.permissions.forEach(perm => {
            cy.getByTestID(`${perm}--value`)
              .should('have.class', 'denied')
              .and('not.have.class', 'value-changed')
              .click({force: true})
              .should('have.class', 'denied')
              .and('have.class', 'value-changed')
          })
        })

        cy.getByTestID('apply-changes--button').click({force: true})

        cy.getByTestID(`${db.name}-db-perm--row`).within(() => {
          role.permissions.forEach(perm => {
            cy.getByTestID(`${perm}--value`)
              .should('not.have.class', 'denied')
              .and('not.have.class', 'value-changed')
              .and('have.class', 'granted')
          })
        })

        cy.getByTestID('exit--button').click({force: true})
        cy.getByTestID('wizard-bucket-selected').click({force: true})
        cy.getByTestID('dropdown-menu').within(() => {
          cy.getByTestID('dropdown--item')
            .contains(db.name)
            .click({force: true})
        })

        cy.getByTestID('wizard-bucket-selected').click({force: true})
        cy.getByTestID(`role-${role.name}--row`).within(() => {
          cy.get('.user-value').should('contain.text', user.name)
          cy.getByTestID('read-permission').should('have.class', 'granted')
          cy.getByTestID('write-permission').should('have.class', 'granted')
        })
      })

      after(() => {
        cy.deleteInfluxDBRole(role.name, sourceId)
        cy.deleteInfluxDBUser(user.name, sourceId)
        cy.deleteInfluxDB(db.name, sourceId)
      })
    })
  })
})
