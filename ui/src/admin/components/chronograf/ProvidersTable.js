import React, {Component} from 'react'
import PropTypes from 'prop-types'

import uuid from 'uuid'
import ProvidersTableRow from 'src/admin/components/chronograf/ProvidersTableRow'
import ProvidersTableRowNew from 'src/admin/components/chronograf/ProvidersTableRowNew'
import {ErrorHandling} from 'src/shared/decorators/errors'
import PageSpinner from 'src/shared/components/PageSpinner'

class ProvidersTable extends Component {
  constructor(props) {
    super(props)

    this.state = {
      isCreatingMap: false,
    }
  }
  handleClickCreateMap = () => {
    this.setState({isCreatingMap: true})
  }

  handleCancelCreateMap = () => {
    this.setState({isCreatingMap: false})
  }

  handleCreateMap = newMap => {
    this.props.onCreateMap(newMap)
    this.setState({isCreatingMap: false})
  }

  render() {
    const {
      mappings = [],
      organizations,
      onUpdateMap,
      onDeleteMap,
      isLoading,
    } = this.props
    const {isCreatingMap} = this.state

    const tableTitle =
      mappings.length === 1 ? '1 Map' : `${mappings.length} Maps`

    // define scheme options
    const SCHEMES = [{text: '*'}, {text: 'oauth2'}]

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
        <div className="panel-heading">
          <h2 className="panel-title">{tableTitle}</h2>
          <button
            className="btn btn-sm btn-primary"
            onClick={this.handleClickCreateMap}
            disabled={isCreatingMap}
          >
            <span className="icon plus" /> Create Mapping
          </button>
        </div>
        {mappings.length || isCreatingMap ? (
          <div className="panel-body">
            <div className="fancytable--labels">
              <div className="fancytable--th provider--scheme">Scheme</div>
              <div className="fancytable--th provider--provider">Provider</div>
              <div className="fancytable--th provider--providerorg">
                Provider Org
              </div>
              <div className="fancytable--th provider--arrow" />
              <div className="fancytable--th provider--redirect">
                Organization
              </div>
              <div className="fancytable--th provider--delete" />
            </div>
            {mappings.map((mapping, i) => (
              <ProvidersTableRow
                key={uuid.v4()}
                mapping={mapping}
                organizations={organizations}
                schemes={SCHEMES}
                onDelete={onDeleteMap}
                onUpdate={onUpdateMap}
                rowIndex={i + 1}
              />
            ))}
            {isCreatingMap ? (
              <ProvidersTableRowNew
                organizations={organizations}
                schemes={SCHEMES}
                onCreate={this.handleCreateMap}
                onCancel={this.handleCancelCreateMap}
                rowIndex={mappings.length + 1}
              />
            ) : null}
          </div>
        ) : (
          <div className="panel-body">
            <div className="generic-empty-state">
              <h4 style={{margin: '50px 0'}}>
                Looks like you have no mappings<br />
                New users will not be able to sign up automatically
              </h4>
              <button
                className="btn btn-sm btn-primary"
                onClick={this.handleClickCreateMap}
                disabled={isCreatingMap}
              >
                <span className="icon plus" /> Create Mapping
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }
}

const {arrayOf, bool, func, shape, string} = PropTypes

ProvidersTable.propTypes = {
  mappings: arrayOf(
    shape({
      id: string,
      scheme: string,
      provider: string,
      providerOrganization: string,
      organizationId: string,
    })
  ).isRequired,
  organizations: arrayOf(
    shape({
      id: string, // when optimistically created, organization will not have an id
      name: string.isRequired,
    })
  ).isRequired,
  onCreateMap: func.isRequired,
  onUpdateMap: func.isRequired,
  onDeleteMap: func.isRequired,
  isLoading: bool.isRequired,
}
export default ErrorHandling(ProvidersTable)
