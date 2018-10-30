import React, {Component} from 'react'
import PropTypes from 'prop-types'

import uuid from 'uuid'
import _ from 'lodash'

import UsersTableHeader from 'src/admin/components/chronograf/UsersTableHeader'
import UsersTableRowNew from 'src/admin/components/chronograf/UsersTableRowNew'
import UsersTableRow from 'src/admin/components/chronograf/UsersTableRow'
import PageSpinner from 'src/shared/components/PageSpinner'

import {USERS_TABLE} from 'src/admin/constants/chronografTableSizing'
import {ErrorHandling} from 'src/shared/decorators/errors'

class UsersTable extends Component {
  constructor(props) {
    super(props)

    this.state = {
      isCreatingUser: false,
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (
      !_.isEqual(this.props, nextProps) || !_.isEqual(this.state, nextState)
    )
  }

  handleChangeUserRole = (user, currentRole) => newRole => {
    this.props.onUpdateUserRole(user, currentRole, newRole)
  }

  handleDeleteUser = user => {
    this.props.onDeleteUser(user)
  }

  handleClickCreateUser = () => {
    this.setState({isCreatingUser: true})
  }

  handleBlurCreateUserRow = () => {
    this.setState({isCreatingUser: false})
  }

  render() {
    const {organization, users, onCreateUser, meID, isLoading} = this.props

    const {isCreatingUser} = this.state
    const {colRole, colProvider, colScheme, colActions} = USERS_TABLE

    if (isLoading) {
      return (
        <div className="panel panel-solid">
          <div className="panel-body">
            <PageSpinner />
          </div>
        </div>
      )
    }
    return (
      <div className="panel panel-solid">
        <UsersTableHeader
          numUsers={users.length}
          onClickCreateUser={this.handleClickCreateUser}
          isCreatingUser={isCreatingUser}
          organization={organization}
        />
        <div className="panel-body">
          <table className="table table-highlight v-center chronograf-admin-table">
            <thead>
              <tr>
                <th>Username</th>
                <th style={{width: colRole}} className="align-with-col-text">
                  Role
                </th>
                <th style={{width: colProvider}}>Provider</th>
                <th style={{width: colScheme}}>Scheme</th>
                <th className="text-right" style={{width: colActions}} />
              </tr>
            </thead>
            <tbody>
              {isCreatingUser ? (
                <UsersTableRowNew
                  organization={organization}
                  onBlur={this.handleBlurCreateUserRow}
                  onCreateUser={onCreateUser}
                />
              ) : null}
              {users.length ? (
                users.map(user => (
                  <UsersTableRow
                    user={user}
                    key={uuid.v4()}
                    organization={organization}
                    onChangeUserRole={this.handleChangeUserRole}
                    onDelete={this.handleDeleteUser}
                    meID={meID}
                  />
                ))
              ) : (
                <tr className="table-empty-state">
                  <th colSpan="5">
                    <p>No Users to display</p>
                  </th>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }
}

const {arrayOf, bool, func, shape, string} = PropTypes

UsersTable.propTypes = {
  users: arrayOf(
    shape({
      id: string,
      links: shape({
        self: string.isRequired,
      }),
      name: string.isRequired,
      provider: string.isRequired,
      roles: arrayOf(
        shape({
          name: string.isRequired,
          organization: string.isRequired,
        })
      ),
      scheme: string.isRequired,
    })
  ).isRequired,
  organization: shape({
    name: string.isRequired,
    id: string.isRequired,
  }),
  onCreateUser: func.isRequired,
  onUpdateUserRole: func.isRequired,
  onDeleteUser: func.isRequired,
  meID: string.isRequired,
  isLoading: bool.isRequired,
}

export default ErrorHandling(UsersTable)
