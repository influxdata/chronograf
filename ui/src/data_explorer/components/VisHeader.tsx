import * as React from 'react'
import * as PropTypes from 'prop-types'
import classnames from 'classnames'
import * as _ from 'lodash'

import {fetchTimeSeriesAsync} from 'shared/actions/timeSeries'
import {resultsToCSV} from 'shared/parsing/resultsToCSV'
import download from 'external/download'

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

const VisHeader = ({views, view, onToggleView, name, query, errorThrown}) =>
  <div className="graph-heading">
    {views.length
      ? <div>
          <ul className="nav nav-tablist nav-tablist-sm">
            {views.map(v =>
              <li
                key={v}
                onClick={onToggleView(v)}
                className={classnames({active: view === v})}
                data-test={`data-${v}`}
              >
                {_.upperFirst(v)}
              </li>
            )}
          </ul>
          {query
            ? <div
                className="btn btn-sm btn-default dlcsv"
                onClick={getCSV(query, errorThrown)}
              >
                <span className="icon download dlcsv" />
                .csv
              </div>
            : null}
        </div>
      : null}
    <div className="graph-title">
      {name}
    </div>
  </div>

const {arrayOf, func, shape, string} = PropTypes

VisHeader.propTypes = {
  views: arrayOf(string).isRequired,
  view: string.isRequired,
  onToggleView: func.isRequired,
  name: string.isRequired,
  query: shape(),
  errorThrown: func.isRequired,
}

export default VisHeader
