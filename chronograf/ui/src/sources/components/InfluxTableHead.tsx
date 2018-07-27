import React, {SFC, ReactElement} from 'react'

import QuestionMarkTooltip from 'src/shared/components/QuestionMarkTooltip'

import {KAPACITOR_TOOLTIP_COPY} from 'src/sources/constants'
import {FLUX_CONNECTION_TOOLTIP} from 'src/flux/constants/connection'

const InfluxTableHead: SFC<{}> = (): ReactElement<
  HTMLTableHeaderCellElement
> => {
  return (
    <thead>
      <tr>
        <th className="source-table--connect-col" />
        <th>InfluxDB Connection</th>
        <th className="text-right" />
        <th>
          Kapacitor Connection
          <QuestionMarkTooltip
            tipID="kapacitor-node-helper"
            tipContent={KAPACITOR_TOOLTIP_COPY}
          />
        </th>
        <th>
          Flux Connection
          <QuestionMarkTooltip
            tipID="kapacitor-node-helper"
            tipContent={FLUX_CONNECTION_TOOLTIP}
          />
        </th>
      </tr>
    </thead>
  )
}

export default InfluxTableHead
