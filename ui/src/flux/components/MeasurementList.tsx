// Libraries
import React, {PureComponent, MouseEvent, ChangeEvent} from 'react'

// Components
import MeasurementListItem from 'src/flux/components/MeasurementListItem'

// Utils
import {ErrorHandling} from 'src/shared/decorators/errors'

// types
import {Source, NotificationAction} from 'src/types'

interface Props {
  db: string
  source: Source
  notify: NotificationAction
  measurements: {[measurement: string]: string[]}
}

interface State {
  searchTerm: string
}

@ErrorHandling
class MeasurementsList extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      searchTerm: '',
    }
  }

  public render() {
    const {searchTerm} = this.state

    return (
      <>
        <div className="flux-schema--filter">
          <input
            className="form-control input-xs"
            placeholder="Filter within Measurements"
            type="text"
            spellCheck={false}
            autoComplete="off"
            value={searchTerm}
            onClick={this.handleClick}
            onChange={this.onSearch}
          />
        </div>
        {this.measurements}
      </>
    )
  }

  private get measurements(): JSX.Element | JSX.Element[] {
    const {source, db, notify} = this.props
    const {searchTerm} = this.state

    const term = searchTerm.toLocaleLowerCase()
    const measurements = Object.entries(this.props.measurements).filter(
      entry => {
        const measurement = entry[0]
        return measurement.toLocaleLowerCase().includes(term)
      }
    )
    if (measurements.length) {
      return measurements.map(([measurement, fields]) => (
        <MeasurementListItem
          source={source}
          db={db}
          searchTerm={searchTerm}
          measurement={measurement}
          key={measurement}
          notify={notify}
          fields={fields}
        />
      ))
    }
    return (
      <div className="flux-schema-tree flux-schema--child">
        <div className="flux-schema--item no-hover" onClick={this.handleClick}>
          <div className="no-results">No more measurements.</div>
        </div>
      </div>
    )
  }

  private onSearch = (e: ChangeEvent<HTMLInputElement>) => {
    this.setState({
      searchTerm: e.target.value,
    })
  }

  private handleClick = (e: MouseEvent<HTMLInputElement | HTMLDivElement>) => {
    e.stopPropagation()
  }
}

export default MeasurementsList
