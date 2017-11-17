import * as React from 'react'
import * as _ from 'lodash'
import * as classnames from 'classnames'

import {fetchTimeSeriesAsync} from 'shared/actions/timeSeries'
import {resultsToCSV} from 'shared/parsing/resultsToCSV'
import download from 'external/download'
import {VisualizationQuery} from 'src/types'

const getCSV = (query, errorThrown) => async () => {
  try {
    const {results} = await fetchTimeSeriesAsync({source: query.host, query})
    const {flag, name, CSVString} = resultsToCSV(results)
    if (flag === 'no_data') {
      errorThrown('no data', 'There are no data to download.')
      return
    }
    download(CSVString, `${name}.csv`, 'text/plain')
  } catch (error) {
    errorThrown(error, 'Unable to download .csv file')
    console.error(error)
  }
}

export interface VisHeaderProps {
  query: VisualizationQuery
  onToggleView: (view: string) => () => void
  errorThrown: (error: string) => void
  views: string[]
  view: string
  name: string
}

const VisHeader: React.SFC<VisHeaderProps> = ({
  views,
  view,
  onToggleView,
  name,
  query,
  errorThrown,
}) => (
  <div className="graph-heading">
    {views.length && (
      <div>
        <ul className="nav nav-tablist nav-tablist-sm">
          {views.map(v => (
            <li
              key={v}
              onClick={onToggleView(v)}
              className={classnames({active: view === v})}
              data-test={`data-${v}`}
            >
              {_.upperFirst(v)}
            </li>
          ))}
        </ul>
        {query && (
          <div
            className="btn btn-sm btn-default dlcsv"
            onClick={getCSV(query, errorThrown)}
          >
            <span className="icon download dlcsv" />
            .csv
          </div>
        )}
      </div>
    )}
    <div className="graph-title">{name}</div>
  </div>
)

export default VisHeader
