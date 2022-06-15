describe('Use Admin tab', () => {
  let url: string
  let sourceId: string

  beforeEach(() => {
    cy.flush()
    cy.createInfluxDBConnection()
    cy.get('@connections').then(sources => {
      sourceId = sources[0].id
      url = `/sources/${sourceId}`
    })
  })

  describe('Chronograf', () => {
    let chronograf: any

    before(() => {
      cy.fixture('chronograf').then(chronografData => {
        chronograf = chronografData
      })
    })

    beforeEach(() => {
      url += '/admin-chronograf'
    })

    describe('Current Org', () => {
      beforeEach(() => {
        cy.visit(url + '/current-organization')
      })

      it('create, edit, and delete a Chronograf user', () => {
        cy.getByTestID('add-user--button').click()
        cy.getByTestID('cancel-new-user--button').click()
        cy.getByTestID('add-user--button').click()
        cy.getByTestID('new-user--table-row').within(() => {
          cy.getByTestID('confirm-new-user--button').should('be.disabled')
          cy.getByTestID('username--input')
            .type(chronograf.user.name)
            .should('have.value', chronograf.user.name)
          cy.getByTestID('confirm-new-user--button').should('be.disabled')
          cy.getByTestID('dropdown-toggle').click()
          cy.getByTestID(`${chronograf.user.role[0]}-dropdown-item`).click()
          cy.get('.dropdown-selected').should(
            'contain.text',
            chronograf.user.role[0]
          )
          cy.getByTestID('oauth-provider--input')
            .type(chronograf.user.oauthProvider)
            .should('have.value', chronograf.user.oauthProvider)
          cy.get('.dropdown-selected').should(
            'contain.text',
            chronograf.user.role[0]
          )
          cy.getByTestID('confirm-new-user--button')
            .should('be.enabled')
            .click()
        })

        cy.getByTestID(`${chronograf.user.name}--table-row`)
          .should('exist')
          .realHover()
          .then(() => {
            cy.getByTestID(`${chronograf.user.name}--table-row`).within(() => {
              cy.getByTestID('dropdown-toggle').realHover().then(() => {
                cy.getByTestID('dropdown-toggle').click()
              })
              
              cy.getByTestID(`${chronograf.user.role[1]}-dropdown-item`)
                .realHover()
                .then(() => {
                  cy.getByTestID(
                    `${chronograf.user.role[1]}-dropdown-item`
                  ).click()
                })
            })
          })

        cy.getByTestID(`${chronograf.user.name}--table-row`)
          .should('exist')
          .realHover()
          .then(() => {
            cy.getByTestID(`${chronograf.user.name}--table-row`).within(() => {
              cy.getByTestID('remove-user--button').should('be.visible').click()
              cy.getByTestID('confirm-btn').click()
            })
          })
      })
    })
  })

  describe('InfluxDB', () => {
    let influxDB: any

    before(() => {
      cy.fixture('influxDB').then(influxDBData => {
        influxDB = influxDBData
      })
    })

    beforeEach(() => {
      cy.deleteInfluxDB(influxDB.db.name, sourceId)
      url += '/admin-influxdb'
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
            cy.getByTestID('rp-name--input').type(
              influxDB.db.retentionPolicies[0].name
            )
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
        cy.createInfluxDB(influxDB.db.name, sourceId)
        cy.createInfluxDBRole(influxDB.role.name, sourceId)
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
        cy.getByTestID('username--input').type(influxDB.user.name)
        cy.getByTestID('password--input').type(influxDB.user.password)
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
        })

        cy.get('.notification-close').click({multiple: true, force: true})
        cy.getByTestID('change-password--button').click({force: true})
        cy.getByTestID('cancel').click({force: true})
        cy.getByTestID('change-password--button').click({force: true})
        cy.getByTestID('new-password--input').type(influxDB.user.password)
        cy.getByTestID('confirm').click({force: true})
        cy.getByTestID('exit--button').click({force: true})
        cy.getByTestID(`user-row--${influxDB.user.name}`).within(() => {
          cy.getByTestID('permissions--values').within(() => {
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
        cy.getByTestID('create-user--button').click()
        cy.get('button').contains('Create').should('be.disabled')
        cy.getByTestID('username--input').type(influxDB.user.name)
        cy.getByTestID('password--input').type(influxDB.user.password)
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
        cy.createInfluxDB(influxDB.db.name, sourceId)
        cy.createInfluxDBUser(
          influxDB.user.name,
          influxDB.user.password,
          sourceId
        )
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

        cy.getByTestID(`role-${influxDB.role.name}--row`).should('not.exist')
        cy.getByTestID('create-role--button').click({force: true})
        cy.getByTestID('dismiss-button').click()
        cy.getByTestID('create-role--button').click({force: true})
        cy.getByTestID('form--cancel-role--button').click()
        cy.getByTestID('create-role--button').click({force: true})
        cy.getByTestID('form--create-role--button').should('be.disabled')
        cy.getByTestID('role-name--input').type(influxDB.role.name)
        cy.getByTestID('form--create-role--button')
          .should('not.be.disabled')
          .click()
        cy.getByTestID('exit--button').click({force: true})
        cy.getByTestID(`role-${influxDB.role.name}--row`)
          .should('exist')
          .within(() => {
            cy.get('a').contains(influxDB.role.name).click({force: true})
          })

        cy.getByTestID(`user-${influxDB.user.name}--selector`)
          .should('not.have.class', 'value-changed')
          .click({force: true})
          .should('have.class', 'value-changed')

        cy.getByTestID(`${influxDB.db.name}-db-perm--row`).within(() => {
          influxDB.role.permissions.forEach((perm: any) => {
            cy.getByTestID(`${perm}--value`)
              .should('have.class', 'denied')
              .and('not.have.class', 'value-changed')
              .click({force: true})
              .should('have.class', 'denied')
              .and('have.class', 'value-changed')
          })
        })

        cy.getByTestID('apply-changes--button').click({force: true})

        cy.getByTestID(`${influxDB.db.name}-db-perm--row`).within(() => {
          influxDB.role.permissions.forEach((perm: any) => {
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
            .contains(influxDB.db.name)
            .click({force: true})
        })

        cy.getByTestID('wizard-bucket-selected').click({force: true})
        cy.getByTestID(`role-${influxDB.role.name}--row`).within(() => {
          cy.get('.user-value').should('contain.text', influxDB.user.name)
          cy.getByTestID('read-permission').should('have.class', 'granted')
          cy.getByTestID('write-permission').should('have.class', 'granted')
        })
      })
    })
  })
})
