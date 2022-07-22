import React, {Component} from 'react'
import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'
import {withRouter, InjectedRouter, WithRouterProps} from 'react-router'

import _ from 'lodash'

import ConfirmButton from 'src/shared/components/ConfirmButton'
import Dropdown from 'src/shared/components/Dropdown'
import InputClickToEdit from 'src/shared/components/InputClickToEdit'

import {meChangeOrganizationAsync} from 'src/shared/actions/auth'

import {ErrorHandling} from 'src/shared/decorators/errors'
import {DEFAULT_ORG_ID} from 'src/admin/constants/chronografAdmin'
import {USER_ROLES} from 'src/admin/constants/chronografAdmin'
import {Organization} from 'src/types'
import {Links} from 'src/types/auth'

interface CurrentOrganization {
  name: string
  id: string
}

interface Props extends WithRouterProps {
  organization: Organization
  currentOrganization: CurrentOrganization
  onDelete: (Organization) => void
  onRename: (Organization, newName: string) => void
  onChooseDefaultRole: (Organization, roleName: string) => void
  meChangeOrganization: (me: string, id) => void
  links: Links
  router: InjectedRouter
}

class OrganizationsTableRow extends Component<Props, Record<string, never>> {
  public shouldComponentUpdate(nextProps) {
    return !_.isEqual(this.props, nextProps)
  }

  public render() {
    const {organization, currentOrganization} = this.props

    const dropdownRolesItems = USER_ROLES.map(role => ({
      ...role,
      text: role.name,
    }))

    return (
      <div
        className="fancytable--row"
        data-test={`${organization.name}-org--row`}
      >
        <div className="fancytable--td orgs-table--active">
          {organization.id === currentOrganization.id ? (
            <button
              className="btn btn-sm btn-success"
              data-test="current-org--button"
            >
              <span className="icon checkmark" /> Current
            </button>
          ) : (
            <button
              className="btn btn-sm btn-default"
              onClick={this.handleChangeCurrentOrganization}
              data-test="switch-current-org--button"
            >
              <span className="icon shuffle" /> Switch to
            </button>
          )}
        </div>
        <InputClickToEdit
          value={organization.name}
          wrapperClass="fancytable--td orgs-table--name"
          onBlur={this.handleUpdateOrgName}
          testId={`${organization.name}-org`}
        />
        <div className="fancytable--td orgs-table--default-role">
          <Dropdown
            items={dropdownRolesItems}
            onChoose={this.handleChooseDefaultRole}
            selected={organization.defaultRole}
            className="dropdown-stretch"
          />
        </div>
        <ConfirmButton
          confirmAction={this.handleDeleteOrg}
          confirmText="Delete Organization?"
          size="btn-sm"
          square={true}
          icon="trash"
          disabled={organization.id === DEFAULT_ORG_ID}
          testId="delete-org--button"
        />
      </div>
    )
  }

  public handleChangeCurrentOrganization = async () => {
    const {router, links, meChangeOrganization, organization} = this.props

    // eslint-disable-next-line @typescript-eslint/await-thenable
    await meChangeOrganization(links.me, {organization: organization.id})
    router.push('')
  }

  public handleUpdateOrgName = newName => {
    const {organization, onRename} = this.props
    onRename(organization, newName)
  }

  public handleDeleteOrg = () => {
    const {onDelete, organization} = this.props
    onDelete(organization)
  }

  public handleChooseDefaultRole = role => {
    const {organization, onChooseDefaultRole} = this.props
    onChooseDefaultRole(organization, role.name)
  }
}

const mapDispatchToProps = dispatch => ({
  meChangeOrganization: bindActionCreators(meChangeOrganizationAsync, dispatch),
})

const mapStateToProps = ({links}) => ({
  links,
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(ErrorHandling(OrganizationsTableRow)))
