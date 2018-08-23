// Libaries
import React, {PureComponent} from 'react'

// Components
import {Radio} from 'src/reusable_ui'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  type: string
  onChangeType: (type: string) => void
}

const STREAM = 'stream'
const BATCH = 'batch'

@ErrorHandling
class TickscriptType extends PureComponent<Props> {
  public render() {
    const {onChangeType, type} = this.props

    return (
      <Radio>
        <Radio.Button
          id="tickscript-type--stream"
          value={STREAM}
          titleText="Change TICKscript to 'Stream' type"
          active={type === STREAM}
          onClick={onChangeType}
        >
          Stream
        </Radio.Button>
        <Radio.Button
          id="tickscript-type--batch"
          value={BATCH}
          titleText="Change TICKscript to 'Batch' type"
          active={type === BATCH}
          onClick={onChangeType}
        >
          Batch
        </Radio.Button>
      </Radio>
    )
  }
}

export default TickscriptType
