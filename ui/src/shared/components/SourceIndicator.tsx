import * as React from 'react'
import * as PropTypes from 'prop-types'
import * as _ from 'lodash'
import * as uuidv4 from 'uuid/v4'

import ReactTooltip from 'react-tooltip'

import {Source} from 'src/types'

export interface SourceIndicatorProps {
  sourceOverride?: Source
}

const SourceIndicator: React.SFC<SourceIndicatorProps> = (
  {sourceOverride},
  {source: {name, url}}
) => {
  const sourceName = _.get(sourceOverride, 'name', null)
    ? sourceOverride.name
    : name
  const sourceUrl = _.get(sourceOverride, 'url', null)
    ? sourceOverride.url
    : url

  if (!sourceName) {
    return null
  }
  const sourceNameTooltip = `<h1>Connected to Source:</h1><p><code>${sourceName} @ ${sourceUrl}</code></p>`
  const uuidTooltip = uuidv4()

  return (
    <div
      className="source-indicator"
      data-for={uuidTooltip}
      data-tip={sourceNameTooltip}
    >
      <span className="icon server2" />
      <ReactTooltip
        id={uuidTooltip}
        effect="solid"
        html={true}
        place="left"
        class="influx-tooltip"
      />
    </div>
  )
}

SourceIndicator.contextTypes = {
  source: PropTypes.shape({
    name: PropTypes.string,
    url: PropTypes.string,
  }),
}

export default SourceIndicator
