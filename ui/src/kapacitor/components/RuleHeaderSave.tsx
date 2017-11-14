import * as React from 'react'
import ReactTooltip from 'react-tooltip'

import SourceIndicator from 'shared/components/SourceIndicator'

import {Source} from 'src/types'

export interface RuleHeaderSaveProps {
  onSave: () => void
  validationError: string
  source: Source
}

const RuleHeaderSave: React.SFC<RuleHeaderSaveProps> = ({
  onSave,
  validationError,
  source,
}) => (
  <div className="page-header__right">
    <SourceIndicator source={source} />
    {validationError ? (
      <button
        className="btn btn-success btn-sm disabled"
        data-for="save-kapacitor-tooltip"
        data-tip={validationError}
      >
        Save Rule
      </button>
    ) : (
      <button className="btn btn-success btn-sm" onClick={onSave}>
        Save Rule
      </button>
    )}
    <ReactTooltip
      id="save-kapacitor-tooltip"
      effect="solid"
      html={true}
      place="bottom"
      class="influx-tooltip kapacitor-tooltip"
    />
  </div>
)

export default RuleHeaderSave
