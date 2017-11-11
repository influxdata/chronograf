import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'

import {getMeAsync} from 'shared/actions/auth'

import * as adminChronografActionCreators from 'src/admin/actions/chronograf'
import {publishAutoDismissingNotification} from 'shared/dispatchers'

import OrganizationsTable from 'src/admin/components/chronograf/OrganizationsTable'

class OrganizationsPage extends Component {
  componentDidMount() {
    const {links, actions: {loadOrganizationsAsync}} = this.props
    loadOrganizationsAsync(links.organizations)
  }

  handleCreateOrganization = async organizationName => {
    const {links, actions: {createOrganizationAsync}} = this.props
    await createOrganizationAsync(links.organizations, {name: organizationName})
    this.refreshMe()
  }

  handleRenameOrganization = async (organization, name) => {
    const {actions: {updateOrganizationAsync}} = this.props
    await updateOrganizationAsync(organization, {...organization, name})
    this.refreshMe()
  }

  handleDeleteOrganization = organization => {
    const {actions: {deleteOrganizationAsync}} = this.props
    deleteOrganizationAsync(organization)
    this.refreshMe()
  }

  refreshMe = () => {
    const {getMe} = this.props
    getMe({allowReset: false})
  }

  render() {
    const {organizations} = this.props

    return (
      <OrganizationsTable
        organizations={organizations}
        onCreateOrg={this.handleCreateOrganization}
        onDeleteOrg={this.handleDeleteOrganization}
        onRenameOrg={this.handleRenameOrganization}
      />
    )
  }
}

const {arrayOf, func, shape, string} = PropTypes

OrganizationsPage.propTypes = {
  links: shape({
    organizations: string.isRequired,
  }),
  organizations: arrayOf(
    shape({
      id: string, // when optimistically created, it will not have an id
      name: string.isRequired,
      link: string,
    })
  ),
  actions: shape({
    loadOrganizationsAsync: func.isRequired,
    createOrganizationAsync: func.isRequired,
    updateOrganizationAsync: func.isRequired,
    deleteOrganizationAsync: func.isRequired,
  }),
  notify: func.isRequired,
}

const mapStateToProps = ({links, adminChronograf: {organizations}}) => ({
  links,
  organizations,
})

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(adminChronografActionCreators, dispatch),
  notify: bindActionCreators(publishAutoDismissingNotification, dispatch),
  getMe: bindActionCreators(getMeAsync, dispatch),
})

export default connect(mapStateToProps, mapDispatchToProps)(OrganizationsPage)
