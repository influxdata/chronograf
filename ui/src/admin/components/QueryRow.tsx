import * as React from 'react'

import ConfirmButtons from 'shared/components/ConfirmButtons'
import {QUERIES_TABLE} from 'admin/constants/tableSizing'
import {InfluxDBAdminQuery} from 'src/types/influxdbAdmin'

export interface QueryRowProps {
  query: InfluxDBAdminQuery
  onKill: (queryID: string) => void
}

export interface QueryRowState {
  confirmingKill: boolean
}

class QueryRow extends React.Component<QueryRowProps, QueryRowState> {
  public state = {
    confirmingKill: false,
  }

  private handleInitiateKill = () => {
    this.setState({confirmingKill: true})
  }

  private handleFinishHim = () => {
    this.props.onKill(this.props.query.id)
  }

  private handleShowMercy = () => {
    this.setState({confirmingKill: false})
  }

  public render() {
    const {query: {database, query, duration}} = this.props

    return (
      <tr>
        <td
          style={{width: `${QUERIES_TABLE.colDatabase}px`}}
          className="monotype"
        >
          {database}
        </td>
        <td>
          <code>{query}</code>
        </td>
        <td
          style={{width: `${QUERIES_TABLE.colRunning}px`}}
          className="monotype"
        >
          {duration}
        </td>
        <td
          style={{width: `${QUERIES_TABLE.colKillQuery}px`}}
          className="text-right"
        >
          {this.state.confirmingKill ? (
            <ConfirmButtons
              onConfirm={this.handleFinishHim}
              onCancel={this.handleShowMercy}
              buttonSize="btn-xs"
            />
          ) : (
            <button
              className="btn btn-xs btn-danger table--show-on-row-hover"
              onClick={this.handleInitiateKill}
            >
              Kill
            </button>
          )}
        </td>
      </tr>
    )
  }
}

export default QueryRow
