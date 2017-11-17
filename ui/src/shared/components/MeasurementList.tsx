import * as React from 'react'
import * as classnames from 'classnames'
import * as _ from 'lodash'

import {showMeasurements} from 'shared/apis/metaQuery'
import showMeasurementsParser from 'shared/parsing/showMeasurements'

import TagList from 'data_explorer/components/TagList'
import FancyScrollbar from 'shared/components/FancyScrollbar'

import {QueryConfig, QuerySource, Source} from 'src/types'
import {func} from 'src/types/funcs'

export interface MeasurementListProps {
  source: Source
  query: QueryConfig
  onChooseMeasurement: (measurement: string) => func
  onChooseTag: func
  onToggleTagAcceptance: func
  onGroupByTag: func
  querySource: QuerySource
}

export interface MeasurementListState {
  measurements: string[]
  filterText: string
}

class MeasurementList extends React.Component<MeasurementListProps> {
  private filterText

  public state = {
    measurements: [],
    filterText: '',
  }

  private handleFilterText = e => {
    e.stopPropagation()
    this.setState({
      filterText: this.filterText.value,
    })
  }

  private handleEscape = e => {
    if (e.key !== 'Escape') {
      return
    }

    e.stopPropagation()
    this.setState({
      filterText: '',
    })
  }

  private handleAcceptReject = e => {
    e.stopPropagation()
    this.props.onToggleTagAcceptance()
  }

  private handleChooseMeasurement = (
    measurement: string,
    isActive: boolean
  ) => () => {
    if (!isActive) {
      this.props.onChooseMeasurement(measurement)
    }
  }

  private renderList = () => {
    if (!this.props.query.database) {
      return (
        <div className="query-builder--list-empty">
          <span>
            No <strong>Database</strong> selected
          </span>
        </div>
      )
    }

    const filterText = this.state.filterText.toLowerCase()
    const measurements = this.state.measurements.filter(m =>
      m.toLowerCase().includes(filterText)
    )

    return (
      <div className="query-builder--list">
        <FancyScrollbar>
          {measurements.map(measurement => {
            const isActive = measurement === this.props.query.measurement
            const numTagsActive = Object.keys(this.props.query.tags).length

            return (
              <div
                key={measurement}
                onClick={this.handleChooseMeasurement(measurement, isActive)}
              >
                <div
                  className={classnames('query-builder--list-item', {
                    active: isActive,
                  })}
                  data-test={`query-builder-list-item-measurement-${
                    measurement
                  }`}
                >
                  <span>
                    <div className="query-builder--caret icon caret-right" />
                    {measurement}
                  </span>
                  {isActive &&
                    numTagsActive >= 1 && (
                      <div
                        className={classnames('flip-toggle', {
                          flipped: this.props.query.areTagsAccepted,
                        })}
                        onClick={this.handleAcceptReject}
                      >
                        <div className="flip-toggle--container">
                          <div className="flip-toggle--front">!=</div>
                          <div className="flip-toggle--back">=</div>
                        </div>
                      </div>
                    )}
                </div>
                {isActive ? (
                  <TagList
                    source={this.props.source}
                    query={this.props.query}
                    querySource={this.props.querySource}
                    onChooseTag={this.props.onChooseTag}
                    onGroupByTag={this.props.onGroupByTag}
                  />
                ) : null}
              </div>
            )
          })}
        </FancyScrollbar>
      </div>
    )
  }

  private _getMeasurements = () => {
    const {querySource, source} = this.props

    const proxy =
      _.get(querySource, ['links', 'proxy'], null) || source.links.proxy

    showMeasurements(proxy, this.props.query.database).then(resp => {
      const {errors, measurementSets} = showMeasurementsParser(resp.data)
      if (errors.length) {
        // TODO: display errors in the UI.
        return console.error('InfluxDB returned error(s): ', errors) // eslint-disable-line no-console
      }

      this.setState({
        measurements: measurementSets[0].measurements,
      })
    })
  }

  public componentDidMount() {
    if (!this.props.query.database) {
      return
    }

    this._getMeasurements()
  }

  public componentDidUpdate(prevProps: MeasurementListProps) {
    const {query, querySource} = this.props

    if (!query.database) {
      return
    }

    if (
      prevProps.query.database === query.database &&
      _.isEqual(prevProps.querySource, querySource)
    ) {
      return
    }

    this._getMeasurements()
  }

  public render() {
    return (
      <div className="query-builder--column">
        <div className="query-builder--heading">
          <span>Measurements & Tags</span>
          {this.props.query.database && (
            <div className="query-builder--filter">
              <input
                className="form-control input-sm"
                ref={r => (this.filterText = r)}
                placeholder="Filter"
                type="text"
                value={this.state.filterText}
                onChange={this.handleFilterText}
                onKeyUp={this.handleEscape}
                spellCheck={false}
                autoComplete="false"
              />
              <span className="icon search" />
            </div>
          )}
        </div>
        {this.renderList()}
      </div>
    )
  }
}

export default MeasurementList
