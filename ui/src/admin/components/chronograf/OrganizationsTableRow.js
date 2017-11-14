import React, {Component, PropTypes} from 'react'

import ConfirmButtons from 'shared/components/ConfirmButtons'
import Dropdown from 'shared/components/Dropdown'
import InputClickToEdit from 'shared/components/InputClickToEdit'

import {USER_ROLES} from 'src/admin/constants/dummyUsers'

class OrganizationsTableRow extends Component {
  constructor(props) {
    super(props)

    this.state = {
      isDeleting: false,
    }
  }

  handleUpdateOrgName = newName => {
    const {organization, onRename} = this.props
    onRename(organization, newName)
  }
  handleDeleteClick = () => {
    this.setState({isDeleting: true})
  }

  handleDismissDeleteConfirmation = () => {
    this.setState({isDeleting: false})
  }

  handleDeleteOrg = organization => {
    const {onDelete} = this.props
    onDelete(organization)
  }

  handleChooseDefaultRole = role => {
    const {organization, onChooseDefaultRole} = this.props
    onChooseDefaultRole(organization, role.name)
  }

  render() {
    const {isDeleting} = this.state
    const {organization} = this.props

    const dropdownRolesItems = USER_ROLES.map(role => ({
      ...role,
      text: role.name,
    }))

    const defaultRoleClassName = isDeleting
      ? 'fancytable--td orgs-table--default-role deleting'
      : 'fancytable--td orgs-table--default-role'

    return (
      <div className="fancytable--row">
        <div className="fancytable--td orgs-table--id">
          {organization.id}
        </div>
        <InputClickToEdit
          value={organization.name}
          wrapperClass="fancytable--td orgs-table--name"
          onUpdate={this.handleUpdateOrgName}
        />
        <div className="fancytable--td orgs-table--public">
          <div className="orgs-table--public-toggle disabled">&mdash;</div>
        </div>
        <div className={defaultRoleClassName}>
          <Dropdown
            items={dropdownRolesItems}
            onChoose={this.handleChooseDefaultRole}
            selected={organization.defaultRole}
            className="dropdown-stretch"
          />
        </div>
        {isDeleting
          ? <ConfirmButtons
              item={organization}
              onCancel={this.handleDismissDeleteConfirmation}
              onConfirm={this.handleDeleteOrg}
              onClickOutside={this.handleDismissDeleteConfirmation}
              confirmLeft={true}
            />
          : <button
              className="btn btn-sm btn-default btn-square"
              onClick={this.handleDeleteClick}
            >
              <span className="icon trash" />
            </button>}
      </div>
    )
  }
}

const {func, shape, string} = PropTypes

OrganizationsTableRow.propTypes = {
  organization: shape({
    id: string, // when optimistically created, organization will not have an id
    name: string.isRequired,
    defaultRole: string.isRequired,
  }).isRequired,
  onDelete: func.isRequired,
  onRename: func.isRequired,
  onChooseDefaultRole: func.isRequired,
}

export default OrganizationsTableRow
