import React, {FunctionComponent} from 'react'
import _ from 'lodash'

import ReactTooltip from 'react-tooltip'
import {SourceContext} from 'src/CheckSources'
import {Source} from 'src/types'

interface Props {
  sourceOverride?: Source
}

const getTooltipText = (source: Source, sourceOverride: Source): string => {
  const {name, url} = source
  const sourceName: string = _.get(sourceOverride, 'name', name)
  const sourceUrl: string = _.get(sourceOverride, 'url', url)

  return `<h1>Connected to Source:</h1><p><code>${sourceName} @ ${sourceUrl}</code></p>`
}

const SourceIndicator: FunctionComponent<Props> = ({sourceOverride}) => {
  return (
    <SourceContext.Consumer>
      {(source: Source) => (
        <div
          className="source-indicator"
          data-for="source-indicator"
          data-tip={getTooltipText(source, sourceOverride)}
        >
          <span className="icon disks" />
          <ReactTooltip
            id="source-indicator"
            effect="solid"
            html={true}
            place="left"
            class="influx-tooltip"
          />
        </div>
      )}
    </SourceContext.Consumer>
  )
}

export default SourceIndicator
