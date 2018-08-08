import React, {PureComponent} from 'react'

import TableSidebar from 'src/flux/components/TableSidebar'
import {FluxTable} from 'src/types'
import NoResults from 'src/flux/components/NoResults'
import TimeMachineTable from 'src/flux/components/TimeMachineTable'

interface Props {
  data: FluxTable[]
}

interface State {
  selectedResultID: string | null
}

class TimeMachineTables extends PureComponent<Props, State> {
  constructor(props) {
    super(props)

    this.state = {
      selectedResultID: this.defaultResultId,
    }
  }

  public componentDidUpdate() {
    if (!this.selectedResult) {
      this.setState({selectedResultID: this.defaultResultId})
    }
  }

  public render() {
    return (
      <div className="time-machine-tables">
        {this.showSidebar && (
          <TableSidebar
            data={this.props.data}
            selectedResultID={this.state.selectedResultID}
            onSelectResult={this.handleSelectResult}
          />
        )}
        {this.shouldShowTable && (
          <TimeMachineTable table={this.selectedResult} />
        )}
        {!this.hasResults && <NoResults />}
      </div>
    )
  }

  private handleSelectResult = (selectedResultID: string): void => {
    this.setState({selectedResultID})
  }

  private get showSidebar(): boolean {
    return this.props.data.length > 1
  }

  private get hasResults(): boolean {
    return !!this.props.data.length
  }

  private get shouldShowTable(): boolean {
    return !!this.props.data && !!this.selectedResult
  }

  private get defaultResultId() {
    const {data} = this.props

    if (data.length && !!data[0]) {
      return data[0].id
    }

    return null
  }

  private get selectedResult(): FluxTable {
    return this.props.data.find(d => d.id === this.state.selectedResultID)
  }
}

export default TimeMachineTables
