import React, {PureComponent} from 'react'
import {getDataForCSV} from 'src/data_explorer/apis'
import {Radio, ButtonShape} from 'src/reusable_ui'
import {Source} from 'src/types'

interface Props {
  source: Source
  views: string[]
  view: string
  query: any
  onToggleView: (view: string) => void
  errorThrown: () => void
}

class VisHeader extends PureComponent<Props> {
  public render() {
    return (
      <div className="graph-heading">
        {this.visTypeToggle}
        {this.downloadButton}
      </div>
    )
  }

  private get visTypeToggle(): JSX.Element {
    const {views, view, onToggleView} = this.props

    if (views.length) {
      return (
        <Radio>
          {views.map(v => (
            <Radio.Button
              id={`de-views-${v}`}
              key={`de-views-${v}`}
              value={v}
              titleText={`View results as ${v}`}
              onClick={onToggleView}
              active={v === view}
            >
              {v}
            </Radio.Button>
          ))}
        </Radio>
      )
    }

    return null
  }

  private get downloadButton(): JSX.Element {
    const {query, source, errorThrown} = this.props

    if (query) {
      return (
        <div
          className="btn btn-sm btn-default dlcsv"
          onClick={getDataForCSV(source, query, errorThrown)}
        >
          <span className="icon download dlcsv" />
          .CSV
        </div>
      )
    }

    return null
  }
}

export default VisHeader
