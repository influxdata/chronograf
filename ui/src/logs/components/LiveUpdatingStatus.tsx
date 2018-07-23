import React, {PureComponent} from 'react'

import RadioButtons from 'src/reusable_ui/components/radio_buttons/RadioButtons'
import {ButtonShape, ComponentColor} from 'src/reusable_ui/types'
import {LiveUpdating} from 'src/types/logs'

interface Props {
  liveUpdating: LiveUpdating
  onChangeLiveUpdatingStatus: () => void
}

export default class LiveUpdatingStatus extends PureComponent<Props> {
  public render() {
    const {liveUpdating, onChangeLiveUpdatingStatus} = this.props
    const buttons = ['icon play', 'icon pause']

    return (
      <RadioButtons
        customClass="logs-viewer--mode-toggle"
        shape={ButtonShape.Square}
        color={ComponentColor.Primary}
        buttons={buttons}
        onChange={onChangeLiveUpdatingStatus}
        activeButton={liveUpdating}
      />
    )
  }
}
